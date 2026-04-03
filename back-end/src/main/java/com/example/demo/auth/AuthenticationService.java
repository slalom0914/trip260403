package com.example.demo.auth;

import com.example.demo.dto.*;
import com.example.demo.model.AccessToken;
import org.springframework.beans.factory.annotation.Value;
import com.example.demo.model.Member;
import com.example.demo.service.MemberService;
import com.example.demo.service.RedisTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Log4j2
@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;
    // Redis연계로 추가된 코드임
    private final RedisTokenService redisTokenService;
    private final PasswordEncoder passwordEncoder;

    public JwtAuthenticationResponse signin(LoginRequest loginRequest) {
        if (redisTokenService.isLoginLocked(loginRequest.getEmail())) {
            long sec = redisTokenService.getLoginLockRemainingSeconds(loginRequest.getEmail());
            String waitHint = sec > 0
                    ? String.format("약 %d초 후에 다시 시도해 주세요.", sec)
                    : "잠시 후 다시 시도해 주세요.";
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "로그인 시도가 제한되었습니다. 2분간 비밀번호 검증을 할 수 없습니다. " + waitHint
            );
        }

        Member rmemVO = memberService.getMemberEmail(loginRequest);
        if (rmemVO == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "가입되지 않은 이메일입니다. 이메일을 확인하거나 회원가입 후 로그인해 주세요."
            );
        }
        if (!passwordEncoder.matches(loginRequest.getPassword(), rmemVO.getPassword())) {
            long fails = redisTokenService.increaseLoginFailCount(rmemVO.getEmail());
            int threshold = RedisTokenService.LOGIN_FAIL_LOCK_THRESHOLD;
            if (fails >= threshold) {
                redisTokenService.setLoginLock(rmemVO.getEmail());
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "비밀번호를 " + threshold + "회 틀려 로그인이 2분간 제한되었습니다. "
                                + "이후에는 실패 카운트가 초기화되니 다시 시도해 주세요."
                );
            }
            int remaining = (int) (threshold - fails);
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "비밀번호가 틀렸습니다. " + remaining + "회 더 틀리면 2분간 로그인이 제한됩니다."
            );
        }
        String member_id = rmemVO.getMember_id();
        String name = rmemVO.getName();
        String email = rmemVO.getEmail();
        String role = rmemVO.getRole();
        String profile_image = rmemVO.getProfile_image();
        String accessToken = jwtTokenProvider.createToken(member_id, role);
        String refreshToken = jwtTokenProvider.createRefreshToken(member_id);
        log.info("signin success userId={} email={}", member_id, email);
        // Redis 노트: 로그인 성공 시 실패·잠금 초기화, refresh:{email} 에 Refresh Token 저장
        redisTokenService.clearLoginFailCount(email);
        redisTokenService.clearLoginLock(email);
        redisTokenService.saveRefreshToken(email, refreshToken, jwtTokenProvider.getRefreshTokenTtlMillis());
        JwtAuthenticationResponse jaResponse = new JwtAuthenticationResponse();
        jaResponse.setRefreshToken(refreshToken);
        jaResponse.setAccessToken(accessToken);
        jaResponse.setRole(role);
        jaResponse.setEmail(email);
        jaResponse.setName(name);
        jaResponse.setMember_id(member_id);
        jaResponse.setProfile_image(profile_image);
        String socialType = rmemVO.getSocial_type();
        jaResponse.setSocial_type(
                socialType != null && !socialType.isBlank() ? socialType : "LOCAL");
        return jaResponse;
    }//end of signin

    //파라미터로 받은 token은 refresh token임.
    /*
    Refresh Token을 이용해서 Access Token / Refresh Token을 재발급하는 메서드
    처리 흐름
    1. 전달 받은 refreshToken에서 email 추출
    2. email 로 회원 조회
    3. refreshToken 자체 유효성 검사
    4. Redis에 저장된 refreshToken과 현재 요청 refreshToken이 같은지 비교
    5. 검증 통과시 새 accessToken / refreshToken 발급
    6. 새 refreshToken을 Redis에 저장
    7. 응답 DTO로 반환
     */
    public JwtAuthenticationResponse refreshToken(String refreshToken) {
        log.info("refreshToken : " + refreshToken);
        try {
            String member_id = jwtTokenProvider.extractEmail(refreshToken);
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setMember_id(member_id);
            Member rmemVO = memberService.getMemberId(loginRequest);
            if (rmemVO == null) {
                throw new RuntimeException("회원 정보를 찾을 수 없습니다.");
            }
            // Redis연계로 변경 및 추가된 코드임
            //서명 위변조 여부 판단, 만료 여부 판단, 사용자 정보와 토큰 정보 일치 여부 등을 검사하여
            //유효하지 않으면 재발급 중담함.
            if (!jwtTokenProvider.isTokenValid(refreshToken, rmemVO)) {
                //return null;
                throw new RuntimeException("유효하지 않은 Refresh Token 입니다.");
            }
            // Redis에 저장된 Refresh Token과 현재 요청으로 들어온 Refresh Token비교
            //로그인 시 Redis에 저장해둔 refresh token과 같아야 함.
            //토큰 도난, 재사용, 예전 refresh token 재사용 방지 목적
            //일치 하지 않으면 재발급 중담.
            if (!redisTokenService.matchesStoredRefreshToken(rmemVO.getEmail(), refreshToken)) {
                return null;
            }
            // 검증 통과시 새 Access Token 발급 (subject = member_id, 로그인 signin과 동일)
            String accessToken = jwtTokenProvider.createToken(rmemVO.getMember_id(), rmemVO.getRole());
            // 새 Refresh Token (subject = member_id)
            String newRefreshToken = jwtTokenProvider.createRefreshToken(rmemVO.getMember_id());
            log.info(refreshToken + ", " + newRefreshToken);
            log.info("이전값과 새로운 값 비교 : " + refreshToken.equals(newRefreshToken));
            // 새 Refresh Token을 Redis에 저장
            // key : refresh:{email}
            // value : newRefreshToken
            // ttl: refresh token 만료 시간과 동일하게 저장
            redisTokenService.saveRefreshToken(
                    rmemVO.getEmail(),
                    newRefreshToken,
                    jwtTokenProvider.getRefreshTokenTtlMillis()
            );
            JwtAuthenticationResponse jaResponse = new JwtAuthenticationResponse();
            jaResponse.setRefreshToken(newRefreshToken);
            jaResponse.setAccessToken(accessToken);
            jaResponse.setRole(rmemVO.getRole());
            jaResponse.setEmail(rmemVO.getEmail());
            jaResponse.setName(rmemVO.getName());
            jaResponse.setMember_id(rmemVO.getMember_id());
            String socialType = rmemVO.getSocial_type();
            jaResponse.setSocial_type(
                    socialType != null && !socialType.isBlank() ? socialType : "LOCAL");
            return jaResponse;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("토큰 재발급 실패", e);
            throw new RuntimeException("토큰 재발급 중 오류가 발생했습니다.", e);
        }
    }//end of refreshToken

    /**
     * 로그아웃: Redis에서 refresh 삭제, 현재 Access Token을 blacklist:{token} 으로 등록.
     * Access Token은 서명·subject 검증 후 이메일이 일치할 때만 처리.
     * 1. 현재 Access Token을 블랙리스트에 등록
     * 2. Redis에 저장된 Refresh Token 삭제
     * 즉, 사용자가 로그아웃한 뒤에
     * 기존 Access Token으로 API 재호출하는 것 방지
     * 기존 Refresh Token으로 토큰 재발급하는 것 방지
     * 를 처리하는 코드입니다.
     *  ### 전체 흐름 ###
     *  1. 요청에서 email, accessToken 추출
     *  2. access token에서 email 추출
     *  3. 요청 email과 토큰 email이 같은지 검증
     *  4. access token 남은 유효시간 계산
     *  5. 남은 시간 있으면 블랙 리스트 등록
     *  6. Redis에 저장된 refresh token삭제
     *  7. 로그아웃 완료. 로그 출력
     */
    public void logout(LogoutRequest request) {
        log.info("logout : " + request.getEmail());
        log.info("access token: " + request.getAccessToken());
        // 1. 요청값 null/blank 검증
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일이 없습니다.");
        }

        if (request.getAccessToken() == null || request.getAccessToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Access Token이 없습니다.");
        }
        String email = request.getEmail().trim();
        String accessToken = request.getAccessToken().trim();
        final String tokenMemberId;
        try {
            tokenMemberId = jwtTokenProvider.extractEmail(accessToken);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 Access Token입니다.");
        }
        LoginRequest emailLookup = new LoginRequest();
        emailLookup.setEmail(email);
        Member byEmail = memberService.getMemberEmail(emailLookup);
        if (byEmail == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다.");
        }
        if (!byEmail.getMember_id().equals(tokenMemberId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "토큰과 이메일이 일치하지 않습니다.");
        }
        // Access Token 블랙 리스트 처리
        // JWT는 원래 발급 후 만료 전 까지 유효
        // 그래서 로그아웃해도 토큰 자체는 살아 있을 수 있음.
        // 이를 막기 위해 Redis에 blacklist:{accessToken} 형태로 저장
        // TTL은 토큰 남은 만료 시간 만큼만 저장. 즉 남은 30초면 Redis에도 30초만 저장되고 자동 삭제 됨.
        long ttlMs = jwtTokenProvider.getAccessTokenRemainingTtlMillis(accessToken);
        if (ttlMs > 0) {
            redisTokenService.addToBlacklist(accessToken, ttlMs);
        }
        // Refresh Token삭제
        // refresh:{email}키 삭제
        // 이후 토큰 재발급 불가
        // 실질적으로 세션 종료 처리
        redisTokenService.deleteRefreshToken(email);
        log.info("logout 완료 email={}", email);
    }

    @Value("${oauth.kakao.client-id}")
    private String kakaoClientId;
    @Value("${oauth.kakao.redirect-uri}")
    private String kakaoRedirectUri;
    public AccessToken kakaoAccessToken(String code) {
        log.info("Kakao getAccessToken");
        log.info("code : " + code);
        //인가코드, clientId, client_secret, redirect_uri, grant_type
        //서버 to 서버 일 때 Spring6 부터 RestTemplate 비추천상태임. 대신 RestClient 사용함.
        RestClient restClient = RestClient.create();

        //MultiValueMap을 통해 자동으로 form-data형식으로 body조립 가능
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", kakaoClientId);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("grant_type", "authorization_code");
        params.add("code", code);

        ResponseEntity<AccessToken> response = restClient.post()
                .uri("https://kauth.kakao.com/oauth/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                // ?code=xxxx&client_id=yyyy&
                .body(params)
                //retrieve: 응답 body값만을 추출
                .retrieve()
                .toEntity(AccessToken.class);
        System.out.println("응답 accessToken JSON : "+ response.getBody());
        return response.getBody();
    }

    //사용자 정보 얻기
    public KakaoProfileDto getKakaoProfile(String token) {
        log.info("getKakaoProfile");
        log.info("token : " + token);
        RestClient restClient = RestClient.create();
        ResponseEntity<KakaoProfileDto> response = restClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header("Authorization", "Bearer "+token)
                .retrieve()
                .toEntity(KakaoProfileDto.class);
        //log.info("profile JSON: " + response.getBody());
        //log.info("profile JSON: " + response.getBody().getKakao_account());
        //log.info("profile JSON: " + response.getBody().getKakao_account().getProfile());
        KakaoProfileDto body = response.getBody();
        log.info("profile JSON: {}", body);

        if (body != null && body.getKakao_account() != null) {
            log.info("email: {}", body.getKakao_account().getEmail());
            if (body.getKakao_account().getProfile() != null) {
                log.info("nickname: {}", body.getKakao_account().getProfile().getNickname());
                log.info("profile_image_url: {}", body.getKakao_account().getProfile().getProfile_image_url());
            } else {
                log.warn("kakao_account.profile is null (동의 없음 가능)");
            }
        } else {
            log.warn("kakao_account is null (동의 없음 가능)");
        }

        if (body != null && body.getKakao_account() != null) {
            KakaoProfileDto.KakaoAccount account = body.getKakao_account();
            if (account.getProfile() != null) {
                body.getKakao_account().setEmail(account.getEmail());
                body.getKakao_account().getProfile().setNickname(account.getProfile().getNickname());
                body.getKakao_account().getProfile().setProfile_image_url(account.getProfile().getProfile_image_url());
            }
        }
        log.info(body);
        return body;
    }

    @Value("${oauth.google.client-id}")
    private String clientId;
    @Value("${oauth.google.client-secret}")
    private String clientSecret;
    @Value("${oauth.google.redirect-uri}")
    private String redirectUri;
    // 구글에서 발급하는 accessToken 받기
    // 구글계정으로 로그인을 하면 인가코드를 보내줌
    // code는 구글서버에서 보내준 인가코드이다.
    // 리액트에서 보내준 인가코드를 가지고 구글서버에 AccessToken을 요청함.
    public AccessToken googleAccessToken(String code) {
        log.info(code);//인가코드
        // 서버(8000번 스프링)에서 서버(구글 서버)로 요청을 할 때는
        // RestClient로 처리함(spring 6)
        // 리액트에서 axios가 하는 역할과 비슷
        RestClient restClient = RestClient.create();
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");
        params.add("code", code);//인가코드 보내야 함
        ResponseEntity<AccessToken> res = restClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(params)
                .retrieve()
                .toEntity(AccessToken.class);
        log.info(res.getBody());
        return res.getBody();
    }//end of getAccessToken
    // 사용자 정보 얻기
    public GoogleProfileDto getGoogleProfile(String token) {
        log.info("getGoogleProfile");
        log.info("token:{}",token);
        //스프링서버에서 구글 서버로 요청하기
        RestClient restClient = RestClient.create();
        ResponseEntity<GoogleProfileDto> response = restClient.get()
                .uri("https://openidconnect.googleapis.com/v1/userinfo")
                .header("Authorization", "Bearer "+token)
                .retrieve()
                .toEntity(GoogleProfileDto.class);
        return response.getBody();
    }//end of getGoogleProfile

}
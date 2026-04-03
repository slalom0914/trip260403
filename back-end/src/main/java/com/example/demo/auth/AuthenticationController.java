package com.example.demo.auth;
import com.example.demo.dto.*;
import com.example.demo.model.AccessToken;
import com.example.demo.model.Member;
import com.example.demo.service.MemberService;
import com.example.demo.service.RedisTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Log4j2
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    private final MemberService memberService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTokenService redisTokenService;
    @PostMapping("/signin")
    public ResponseEntity<Map<String,Object>> signin(@RequestBody LoginRequest loginRequest) {
        log.info("signin");
        log.info("signin : " + loginRequest);
        try{
            log.info("signin ok email={}", loginRequest.getEmail());
            JwtAuthenticationResponse jaResponse = authenticationService.signin(loginRequest);
            log.info("signin ok jaResponse={}", jaResponse);
            //일치하면 access 토큰 발급
            //아래서 발급받은 토큰을 jwt.io에 Encoded에 붙여넣고 Decoded된 정보확인 할 것.
            Map<String, Object> loginInfo = new HashMap<>();
            loginInfo.put("member_id", jaResponse.getMember_id());
            loginInfo.put("accessToken", jaResponse.getAccessToken());
            loginInfo.put("refreshToken", jaResponse.getRefreshToken());
            loginInfo.put("name", jaResponse.getName());
            loginInfo.put("email", jaResponse.getEmail());
            loginInfo.put("role", jaResponse.getRole());
            loginInfo.put("profile_image", jaResponse.getProfile_image());
            loginInfo.put("social_type", jaResponse.getSocial_type());
            return new ResponseEntity<>(loginInfo, HttpStatus.OK);
        }catch(ResponseStatusException ex){
            // 기본 /error 응답은 include-message 설정에 따라 message가 비는 경우가 있어, 화면 표시용으로 직접 반환
            Map<String, Object> err = new HashMap<>();
            String reason = ex.getReason();
            err.put("message", reason != null && !reason.isBlank()
                    ? reason
                    : "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
            return new ResponseEntity<>(err, ex.getStatusCode());
        }

    }
    @PostMapping("/refresh")
    public ResponseEntity<Map<String,Object>> refreshToken(@RequestBody RefreshRequest refreshRequest) {
        //public ResponseEntity<JwtAuthenticationVO> refreshToken(@RequestParam String refreshToken, @RequestBody Map<String,Object> pmap) {
        log.info("refreshToken:{}", refreshRequest.getRefreshToken());
        JwtAuthenticationResponse jaResponse = authenticationService.refreshToken(refreshRequest.getRefreshToken());
        if (jaResponse == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        Map<String, Object> loginInfo = new HashMap<>();
        loginInfo.put("member_id", jaResponse.getMember_id());
        loginInfo.put("accessToken", jaResponse.getAccessToken());
        loginInfo.put("refreshToken", jaResponse.getRefreshToken());
        loginInfo.put("name", jaResponse.getName());
        loginInfo.put("email", jaResponse.getEmail());
        loginInfo.put("role", jaResponse.getRole());
        loginInfo.put("social_type", jaResponse.getSocial_type());
        return new ResponseEntity<>(loginInfo, HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody LogoutRequest request) {
        log.info("logout" + request.getEmail()+", "+request.getMember_id());
        log.info("accessToken : " + request.getAccessToken());
        authenticationService.logout(request);
        return ResponseEntity.ok().build();
    }

    // http://localhost:8000/member/google/doLogin, {code: '12345678'}
    // 파라미터로 사용되는 @RequestBody은 리액트가 전송하는 객체 리터럴을 받아줌
    @PostMapping("/googleLogin")
    public ResponseEntity<?> googleLogin(@RequestBody RedirectDto redirectDto){
        log.info("googleLogin");
        // 1.프론트에서 넘어온 인가 코드(code)를 받는 API
        // React가 구글 로그인 성공 후, 구글이 준 code를 백엔드로 전달함
        // 이 code는 'Access Token발급'을 위한 1회성 교환권 같은 값임
        log.info("redirectDto:{}",redirectDto.getCode());
        // 2. 인가코드로 구글 Access Token 발급 받기
        AccessToken accessTokenVO = authenticationService.googleAccessToken(redirectDto.getCode());
        log.info("구글서버가 보내준 AccessToken:{}",accessTokenVO.getAccess_token());
        // access token은 구글 API를 호출할 수 있는 열쇠
        // 3. Access Token으로 구글 사용자 프로필 정보 가져오기
        GoogleProfileDto googleProfileDto =
                authenticationService.getGoogleProfile(accessTokenVO.getAccess_token());
        // 4. 회원가입이 되어 있는지 여부를 파악해서 강제로 회원가입을 시킨다.
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setMember_id(googleProfileDto.getSub());
        Member mVO = memberService.getMemberId(loginRequest);
        log.info("mVO : "+mVO);
        if(mVO==null){
            mVO = memberService.oauthCreate(googleProfileDto.getSub(), googleProfileDto.getName()
                    , "123"
                    , googleProfileDto.getEmail(), "GOOGLE");
        }
        else{
            log.info("이미 회원가입이 되어있는 socialId 입니다."+mVO.getMember_id());
        }
        // 5. 우리 서비스에서 사용할 JWT토큰 발급하기
        String accessToken = jwtTokenProvider.createToken(googleProfileDto.getSub(), mVO.getRole().toString());
        String refreshToken = jwtTokenProvider.createRefreshToken(googleProfileDto.getSub());
        // signin과 동일: 로그인 성공 시 Redis refresh:{email} 저장, 로컬 로그인 실패·잠금 초기화
        String emailForRedis = mVO.getEmail();
        log.info("emailForRedis : "+emailForRedis);
        redisTokenService.clearLoginFailCount(emailForRedis);
        redisTokenService.clearLoginLock(emailForRedis);
        redisTokenService.saveRefreshToken(emailForRedis, refreshToken, jwtTokenProvider.getRefreshTokenTtlMillis());
        // 6. 프론트로 내려줄 로그인 결과 구성
        Map<String,Object> loginInfo = new HashMap<>();
        loginInfo.put("member_id", googleProfileDto.getSub());
        loginInfo.put("accessToken", accessToken);
        loginInfo.put("refreshToken", refreshToken);
        loginInfo.put("role", mVO.getRole());
        loginInfo.put("name", googleProfileDto.getName());
        loginInfo.put("email", googleProfileDto.getEmail());
        loginInfo.put("profile_image", googleProfileDto.getPicture());
        loginInfo.put("social_type", mVO.getSocial_type());
        return new ResponseEntity<>(loginInfo, HttpStatus.OK);
    }//end of doLogin
    // http://localhost:8000/api/auth/kakaoLogin
    @PostMapping("/kakaoLogin")
    public ResponseEntity<?> kakaoLogin(@RequestBody RedirectDto redirectDto){
        log.info("doLogin");
        log.info("redirectDto:{}",redirectDto.getCode());
        //accessToken 발급
        AccessToken accessTokenDto = authenticationService.kakaoAccessToken(redirectDto.getCode());
        //사용자 정보 얻기
        KakaoProfileDto kakaoProfile = authenticationService.getKakaoProfile(accessTokenDto.getAccess_token());
        //회원가입 되어 있지 않다면 회원 가입
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setMember_id(kakaoProfile.getId());
        Member originalMember = memberService.getMemberId(loginRequest);
        if(originalMember == null) {
            originalMember = memberService.oauthCreate(kakaoProfile.getId(), kakaoProfile.getKakao_account().getProfile().getNickname()
                    ,"123"
                    ,kakaoProfile.getKakao_account().getEmail(), "KAKAO");
        }
        log.info("kakaoProfile getId():{}",kakaoProfile.getId());
        log.info("originalMember:{}",originalMember.getMember_id());
        //회원 가입 되어 있는 회원이라면 토큰 발급
        String accessToken = jwtTokenProvider.createToken(kakaoProfile.getId(), originalMember.getRole().toString());
        String refreshToken = jwtTokenProvider.createRefreshToken(kakaoProfile.getId());
        String emailForRedis = originalMember.getEmail();
        log.info("emailForRedis : "+emailForRedis);
        redisTokenService.clearLoginFailCount(emailForRedis);
        redisTokenService.clearLoginLock(emailForRedis);
        redisTokenService.saveRefreshToken(emailForRedis, refreshToken, jwtTokenProvider.getRefreshTokenTtlMillis());
        Map<String, Object> loginInfo = new HashMap<>();
        loginInfo.put("member_id", kakaoProfile.getId());
        loginInfo.put("accessToken", accessToken);
        loginInfo.put("refreshToken", refreshToken);
        loginInfo.put("role", originalMember.getRole());
        loginInfo.put("name", kakaoProfile.getKakao_account().getProfile().getNickname());
        loginInfo.put("email", kakaoProfile.getKakao_account().getEmail());
        loginInfo.put("profile_image", kakaoProfile.getKakao_account().getProfile().getProfile_image_url());
        loginInfo.put("social_type", originalMember.getSocial_type());
        return new ResponseEntity<>(loginInfo, HttpStatus.OK);
    }//end of doLogin

}

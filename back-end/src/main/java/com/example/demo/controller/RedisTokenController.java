package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.service.RedisTokenFacadeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Redis 기반 인증 상태 관리용 컨트롤러
 * <p>
 * Refresh Token ({@code refresh:{email}} → token) 용도:
 * <ul>
 *   <li>로그인 성공 시 저장 — {@code POST /api/redis/refresh}</li>
 *   <li>재발급 시 Redis 값과 요청 토큰 일치 검증 — {@code POST /api/redis/refresh/validate}</li>
 *   <li>로그아웃 시 삭제 — {@code DELETE /api/redis/refresh?email=}</li>
 * </ul>
 * 그 외: 블랙리스트, 로그인 실패 횟수.
 * Redis 접근은 RedisTokenFacadeService에 위임한다.
 */
@Log4j2
@RestController
@RequestMapping("/api/redis")
@RequiredArgsConstructor
public class RedisTokenController {

    // 실제 Redis 인증 상태 관리는 FacadeService에 위임
    private final RedisTokenFacadeService redisTokenFacadeService;

    /**
     * 로그인 성공 직후 등: Refresh Token을 Redis에 저장 ({@code refresh:{email}}).
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse> saveRefreshToken(@RequestBody RefreshTokenRequest request) {

        log.info("saveRefreshToken : " + request);

        // 서비스 계층에 저장 처리 위임
        redisTokenFacadeService.saveRefreshToken(request);

        // 성공 응답 반환
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("Refresh Token이 Redis에 저장되었습니다.")
                        .data(null)
                        .build()
        );
    }//end of saveRefreshToken

    /**
     * 액세스 토큰 재발급 직전: Redis에 저장된 Refresh Token과 요청 본문의 토큰이 같은지 검사.
     * {@code true}일 때만 재발급을 진행하는 것이 안전하다.
     */
    @PostMapping("/refresh/validate")
    public ResponseEntity<ApiResponse> validateRefreshToken(@RequestBody RefreshTokenValidateRequest request) {
        log.info("validateRefreshToken : " + request);
        // Redis에 저장된 refresh token과 요청 token이 같은지 검사.
        boolean matched = redisTokenFacadeService.matchesStoredRefreshToken(request);

        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message(matched
                                ? "Redis에 저장된 Refresh Token과 일치합니다."
                                : "저장된 Refresh Token이 없거나 요청 토큰과 일치하지 않습니다.")
                        .data(matched)
                        .build()
        );
    }//end of validateRefreshToken

    /**
     * Refresh Token 조회
     *
     * 요청 URL:
     * GET /api/redis/refresh?email=test@test.com
     *
     * 동작:
     * - 이메일 기준으로 Redis에 저장된 refresh token 조회
     * - 조회 결과 반환
     */
    @GetMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> getRefreshToken(
            @RequestParam("email") String email
    ) {
        // 서비스에서 refresh token 조회
        RefreshTokenResponse response = redisTokenFacadeService.getRefreshToken(email);

        // 응답 반환
        return ResponseEntity.ok(
                ApiResponse.<RefreshTokenResponse>builder()
                        .success(true)
                        .message("Refresh Token 조회 성공")
                        .data(response)
                        .build()
        );
    }

    /**
     * 로그아웃 시 등: 해당 이메일의 Refresh Token을 Redis에서 삭제.
     */
    @DeleteMapping("/refresh")
    public ResponseEntity<ApiResponse> deleteRefreshToken(
            @RequestParam("email") String email
    ) {
        // 서비스 계층에 삭제 위임
        redisTokenFacadeService.deleteRefreshToken(email);

        // 성공 응답 반환
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("Refresh Token이 삭제되었습니다.")
                        .data(null)
                        .build()
        );
    }

    /**
     * Access Token 블랙리스트 등록
     *
     * 요청 URL:
     * POST /api/redis/blacklist
     *
     * 요청 Body:
     * {
     *   "accessToken": "sample-access-token",
     *   "ttlMs": 300000
     * }
     *
     * 동작:
     * - 로그아웃된 access token을 Redis 블랙리스트에 등록
     */
    @PostMapping("/blacklist")
    public ResponseEntity<ApiResponse> addToBlacklist(@RequestBody BlacklistRequest request) {
        log.info("addToBlacklist : " + request);
        // 로그아웃된 access token을 블랙리스트에 등록
        redisTokenFacadeService.addToBlacklist(request);

        // 성공 응답 반환
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("Access Token이 블랙리스트에 등록되었습니다.")
                        .data(null)
                        .build()
        );
    }//end of addToBlacklist

    /**
     * Access Token 블랙리스트 여부 확인
     *
     * 요청 URL:
     * GET /api/redis/blacklist?accessToken=sample-access-token
     *
     * 동작:
     * - 해당 access token이 블랙리스트에 존재하는지 확인
     * - true / false 반환
     */
    @GetMapping("/blacklist")
    public ResponseEntity<ApiResponse> isBlacklisted(
            @RequestParam("accessToken") String accessToken
    ) {
        log.info("isBlacklisted : " + accessToken);
        // 블랙리스트 여부 확인
        boolean result = redisTokenFacadeService.isBlacklisted(accessToken);
        log.info("isBlacklisted : " + result);
        // 응답 반환
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("블랙리스트 조회 성공")
                        .data(result)
                        .build()
        );
    }

    /**
     * 로그인 실패 횟수 증가
     *
     * 요청 URL:
     * POST /api/redis/login-fail/increase
     *
     * 요청 Body:
     * {
     *   "email": "test@test.com"
     * }
     *
     * 동작:
     * - 로그인 실패 횟수를 1 증가
     * - 증가된 횟수를 응답으로 반환
     */
    @PostMapping("/login-fail/increase")
    public ResponseEntity<ApiResponse> increaseLoginFailCount(@RequestBody LoginFailRequest request) {
        log.info("increaseLoginFailCount : " + request);
        // 실패 횟수 증가 후 현재 count값 반환
        long failCount = redisTokenFacadeService.increaseLoginFailCount(request);

        // 응답 반환
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("로그인 실패 횟수가 증가되었습니다.")
                        .data(failCount)
                        .build()
        );
    }//end of increaseLoginFailCount

    /**
     * 로그인 실패 횟수 조회
     *
     * 요청 URL:
     * GET /api/redis/login-fail?email=test@test.com
     *
     * 동작:
     * - 현재 이메일 기준 로그인 실패 횟수 조회
     */
    @GetMapping("/login-fail")
    public ResponseEntity<ApiResponse> getLoginFailCount(@RequestParam("email") String email) {
        log.info("getLoginFailCount : " + email);
        // 실패 횟수 조회
        long failCount = redisTokenFacadeService.getLoginFailCount(email);
        log.info("로그인 실패 횟수 조회 : " + failCount);
        // 응답 반환
        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message("로그인 실패 횟수 조회 성공")
                        .data(failCount)
                        .build()
        );
    }

    /**
     * 로그인 실패 횟수 초기화
     *
     * 요청 URL:
     * DELETE /api/redis/login-fail?email=test@test.com
     *
     * 동작:
     * - 로그인 성공 시 실패 횟수 제거
     */
    @DeleteMapping("/login-fail")
    public ResponseEntity<ApiResponse<Void>> clearLoginFailCount(
            @RequestParam("email") String email
    ) {
        // 실패 횟수 초기화
        redisTokenFacadeService.clearLoginFailCount(email);

        // 성공 응답 반환
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("로그인 실패 횟수가 초기화되었습니다.")
                        .data(null)
                        .build()
        );
    }
}

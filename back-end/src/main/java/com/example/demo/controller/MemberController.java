package com.example.demo.controller;

import com.example.demo.auth.LoginMember;
import com.example.demo.dto.MemberResponse;
import com.example.demo.service.MemberService;
import com.example.demo.model.Member;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Log4j2
@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;

    @GetMapping("/memberList")
    public List<Map<String, Object>> memberList(
            @RequestBody(required = false) Map<String, Object> map) {
        log.info("memberList");
        Map<String, Object> params = map != null ? map : Collections.emptyMap();
        return memberService.memberList(params);
    }
    @GetMapping("/memberDetail")
    public Map<String, Object> memberDetail(@RequestBody Map<String, Object> map) {
        log.info("memberDetail");
        Map<String, Object> mMap = null;
        mMap = memberService.memberDetail(map);
        return mMap;
    }
    @PostMapping(value = "/memberInsert", consumes = MediaType.APPLICATION_JSON_VALUE)
    public int memberInsertJson(@RequestBody Member member) {
        log.info(member.toString());
        return memberService.memberInsert(member);
    }

    /**
     * 회원가입 등: 닉네임 중복 여부 조회 ({@code exists: true} 이면 이미 사용 중).
     */
    @GetMapping("/existsNickname")
    public ResponseEntity<Map<String, Boolean>> existsNickname(
            @RequestParam(value = "nickname", required = false) String nickname) {
        if (nickname == null || nickname.isBlank()) {
            return ResponseEntity.ok(Map.of("exists", false));
        }
        boolean exists = memberService.existsByNickname(nickname);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    /**
     * 회원가입 + 선택 프로필 이미지(multipart).
     * 파일은 application.yaml의 {@code app.upload-path}(예: webapp/pds)에 저장되고,
     * DB {@code member.profile_image}에는 저장 파일명만 기록됩니다.
     */
    @PostMapping(value = "/memberInsert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public int memberInsertMultipart(
            @RequestParam("member_id") String member_id,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String name,
            @RequestParam String nickname,
            @RequestParam(required = false) String social_type,
            @RequestParam String role,
            @RequestParam String status,
            @RequestParam String profile_image_name,
            @RequestPart(value = "profile_image", required = false) MultipartFile profileImage
    ) {
        log.info("memberInsertMultipart");
        Member member = Member.builder()
                .member_id(member_id)
                .email(email)
                .password(password)
                .name(name)
                .nickname(nickname)
                .social_type(social_type != null && !social_type.isBlank() ? social_type : "LOCAL")
                .role(role)
                .status(status)
                .access_token(null)
                .refresh_token(null)
                .profile_image(profile_image_name)
                .build();
        try {
            log.info("memberInsertMultipart : "+member);
            return memberService.memberInsert(member, profileImage);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
    @PutMapping("/memberUpdate")
    public int memberUpdate(@RequestBody Map<String, Object> map) {
        int result = 0;
        result = memberService.memberUpdate(map);
        return result;
    }
    @DeleteMapping("/memberDelete")
    public int memberDelete(@RequestParam(value = "map",required = true ) Map<String, Object> map) {
        int result = 0;
        result = memberService.memberDelete(map);
        return result;
    }
}

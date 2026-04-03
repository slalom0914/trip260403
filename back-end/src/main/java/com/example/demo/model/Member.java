package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회원 테이블(member) VO.
 *
 * <pre>
 * member_id, email, password, name, nickname, profile_image,
 * social_type, role, access_token, refresh_token,
 * create_date, latest_date, status
 * </pre>
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Member {

    /** 회원 ID (PK) */
    private String member_id;

    /** 이메일 */
    private String email;

    /** 비밀번호 (암호화 저장) */
    private String password;

    /** 이름 */
    private String name;

    /** 닉네임 */
    private String nickname;

    /** 프로필 이미지 URL */
    private String profile_image;

    /** 로그인 타입 (LOCAL, GOOGLE, KAKAO 등) */
    private String social_type;

    /** 권한 (USER, ADMIN 등) */
    private String role;

    /** Access Token */
    private String access_token;

    /** Refresh Token */
    private String refresh_token;

    /** 생성일 */
    private String create_date;

    /** 최근 로그인 일시 */
    private String latest_date;

    /** 상태 (ACTIVE, INACTIVE, BLOCKED) */
    private String status;
}

package com.example.demo.dto;

import lombok.Data;

@Data
public class JwtAuthenticationResponse {
    private String member_id;
    private String accessToken;
    private String refreshToken;
    private String role;
    private String name;
    private String email;
    private String profile_image;
    /** LOCAL, KAKAO, GOOGLE 등 */
    private String social_type;
}

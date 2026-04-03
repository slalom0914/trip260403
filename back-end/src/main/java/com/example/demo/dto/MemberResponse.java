package com.example.demo.dto;

import com.example.demo.auth.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MemberResponse {
    /** member.member_id (VARCHAR PK) */
    private String member_id;
    private String email;
    private String name;
    private Role role;
}
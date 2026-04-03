package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    private String member_id;
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;
}

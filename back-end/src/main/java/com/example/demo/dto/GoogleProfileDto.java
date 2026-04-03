package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@JsonIgnoreProperties(ignoreUnknown = true) //없는 필드는 무시함.
public class GoogleProfileDto {
    private String sub;//구글 Open 아이디값
    private String email;
    private String picture;
    private String name;
}

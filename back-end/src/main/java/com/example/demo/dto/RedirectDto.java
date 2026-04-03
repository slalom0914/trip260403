package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
// VO도 파라미터용하고 리턴타입용을 분리해서 관리함.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RedirectDto {
    private String code;

}

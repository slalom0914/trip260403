package com.example.demo.config;

import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * 외부 HTTP API 호출용 공용 WebClient.
 * <p>
 * 기상청·AI 서버 등은 각 서비스에서 전체 URI(또는 {@code UriComponentsBuilder})로 호출하므로
 * baseUrl 없이 Spring Boot 기본 {@link WebClient.Builder} 설정을 그대로 사용합니다.
 * AI 베이스 URL은 {@code application.yaml}의 {@code ai.base-url} 등에서 주입해 사용합니다.
 */
@Log4j2
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        log.info("webClient");
        return builder.build();
    }
}
package com.example.demo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * 애플리케이션 시작 시 Redis 연결/쓰기/읽기 테스트
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisConnectionTestRunner implements CommandLineRunner {

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${spring.data.redis.host}")
    private String redisHost;
    @Value("${spring.data.redis.port}")
    private int redisPort;
    @Value("${spring.data.redis.database:0}")
    private int redisDatabase;

    @Override
    public void run(String... args) {
        try {
            log.info("Redis 연결 대상: {}:{} (DB {})", redisHost, redisPort, redisDatabase);
            stringRedisTemplate.opsForValue().set("health:redis", "ok");
            String value = stringRedisTemplate.opsForValue().get("health:redis");
            log.info("Redis 연결 성공, 조회값 = {}", value);
            log.info("※ 데이터 확인: docker exec <이_컨테이너> redis-cli -n {} GET health:redis", redisDatabase);
            log.info("  위 GET이 (nil)이면 스프링은 다른 호스트/포트 Redis에 붙어 있습니다. docker port 로 6379 매핑을 확인하세요.");
        } catch (Exception e) {
            log.error("Redis 연결 실패: {}", e.getMessage(), e);
        }
    }
}

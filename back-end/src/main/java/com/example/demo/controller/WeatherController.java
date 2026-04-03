package com.example.demo.controller;

import com.example.demo.dto.weather.UltraSrtFcstRequest;
import com.example.demo.dto.weather.UltraSrtFcstResponse;
import com.example.demo.service.WeatherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 날씨 조회 API 컨트롤러
 */
@Log4j2
@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WeatherController {

    private final WeatherService weatherService;

    /**
     * 초단기예보 조회
     */
    @PostMapping("/ultra-short-forecast")
    public ResponseEntity<UltraSrtFcstResponse> getUltraShortForecast(
            @Valid @RequestBody UltraSrtFcstRequest request
    ) {
        UltraSrtFcstResponse response = weatherService.getUltraShortForecast(request);
        return ResponseEntity.ok(response);
    }
}
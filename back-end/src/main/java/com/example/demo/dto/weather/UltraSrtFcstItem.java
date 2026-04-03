package com.example.demo.dto.weather;

import lombok.Builder;
import lombok.Getter;

/**
 * 프론트에 내려줄 예보 항목 DTO
 */
@Getter
@Builder
public class UltraSrtFcstItem {

    // 자료구분코드 예: T1H, SKY, RN1 등
    private String category;

    // 예보일자
    private String fcstDate;

    // 예보시각
    private String fcstTime;

    // 예보값
    private String fcstValue;

    // 발표일자
    private String baseDate;

    // 발표시각
    private String baseTime;

    // 격자 X
    private Integer nx;

    // 격자 Y
    private Integer ny;
}
package com.example.demo.dto.weather;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * 프론트에서 받는 초단기예보 조회 요청 DTO
 */
@Getter
@Setter
public class UltraSrtFcstRequest {

    // 발표일자 예: 20260402
    @NotBlank(message = "baseDate는 필수입니다.")
    private String baseDate;

    // 발표시각 예: 0630
    @NotBlank(message = "baseTime은 필수입니다.")
    private String baseTime;

    // 예보지점 X 좌표
    @NotNull(message = "nx는 필수입니다.")
    private Integer nx;

    // 예보지점 Y 좌표
    @NotNull(message = "ny는 필수입니다.")
    private Integer ny;

    // 페이지 번호 기본값
    private Integer pageNo = 1;

    // 한 페이지 결과 수 기본값
    private Integer numOfRows = 100;
}
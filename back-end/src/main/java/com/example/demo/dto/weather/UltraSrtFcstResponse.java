package com.example.demo.dto.weather;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 프론트에 반환할 응답 DTO
 */
@Getter
@Builder
public class UltraSrtFcstResponse {

    // 결과 코드
    private String resultCode;

    // 결과 메시지
    private String resultMsg;

    // 전체 개수
    private Integer totalCount;

    // 예보 목록
    private List<UltraSrtFcstItem> items;
}
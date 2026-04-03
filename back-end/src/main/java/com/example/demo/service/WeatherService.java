package com.example.demo.service;

import com.example.demo.dto.weather.UltraSrtFcstItem;
import com.example.demo.dto.weather.UltraSrtFcstRequest;
import com.example.demo.dto.weather.UltraSrtFcstResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * 기상청 초단기예보 조회 서비스
 */
@Log4j2
@Service
@RequiredArgsConstructor
public class WeatherService {

  private final WebClient webClient;

  @Value("${weather.api.base-url}")
  private String baseUrl;

  /**
   * 반드시 공공데이터포털의 "디코딩 키"를 넣는다.
   */
  @Value("${weather.api.service-key}")
  private String serviceKey;

  /**
   * 기상청 초단기예보 조회 URI 생성
   *
   * 주의:
   * 1. 인증 파라미터명은 명세대로 {@code serviceKey}
   * 2. {@code bodyToMono(Map.class)} 는 JSON 전용 → {@code dataType} 은 반드시 {@code JSON} (XML이면 200이어도 본문 디코딩 실패로 오류)
   */
  private URI buildUltraSrtFcstUri(UltraSrtFcstRequest request) {
    // serviceKey를 먼저 직접 인코딩
    final String encodedServiceKey = URLEncoder.encode(
            serviceKey.trim(),
            StandardCharsets.UTF_8
    );

    URI uri = UriComponentsBuilder.fromHttpUrl(baseUrl.trim())
            .path("/getUltraSrtFcst")
            // 사용자가 원하는 출력 형태: serviceKey (소문자)
            .queryParam("serviceKey", encodedServiceKey)
            .queryParam("pageNo", request.getPageNo() != null ? request.getPageNo() : 1)
            // 사용자가 원하는 기본값: 1000
            .queryParam("numOfRows", request.getNumOfRows() != null ? request.getNumOfRows() : 1000)
            .queryParam("dataType", "JSON")
            .queryParam("base_date", request.getBaseDate())
            .queryParam("base_time", request.getBaseTime())
            .queryParam("nx", request.getNx())
            .queryParam("ny", request.getNy())
            // 이미 serviceKey를 인코딩했으므로 true로 빌드
            .build(true)
            .toUri();

    return uri;
  }

  /**
   * 단일 item 또는 배열 item을 모두 처리하기 위한 정규화 메서드
   */
  @SuppressWarnings("unchecked")
  private static List<Map<String, Object>> normalizeItemList(Object itemObj) {
    if (itemObj == null) {
      return Collections.emptyList();
    }

    if (itemObj instanceof List<?> itemList) {
      List<Map<String, Object>> result = new ArrayList<>();
      for (Object obj : itemList) {
        if (obj instanceof Map<?, ?> mapObj) {
          result.add((Map<String, Object>) mapObj);
        }
      }
      return result;
    }

    if (itemObj instanceof Map<?, ?> mapObj) {
      return List.of((Map<String, Object>) mapObj);
    }

    return Collections.emptyList();
  }

  /**
   * Map -> DTO 변환
   */
  private static UltraSrtFcstItem toItem(Map<String, Object> row) {
    return UltraSrtFcstItem.builder()
            .category(String.valueOf(row.get("category")))
            .fcstDate(String.valueOf(row.get("fcstDate")))
            .fcstTime(String.valueOf(row.get("fcstTime")))
            .fcstValue(String.valueOf(row.get("fcstValue")))
            .baseDate(String.valueOf(row.get("baseDate")))
            .baseTime(String.valueOf(row.get("baseTime")))
            .nx(Integer.parseInt(String.valueOf(row.get("nx"))))
            .ny(Integer.parseInt(String.valueOf(row.get("ny"))))
            .build();
  }

  /**
   * 초단기예보 조회
   */
  @SuppressWarnings("unchecked")
  public UltraSrtFcstResponse getUltraShortForecast(UltraSrtFcstRequest request) {
    try {
      URI uri = buildUltraSrtFcstUri(request);
      log.info("기상청 초단기예보 요청 URI={}", uri);

      Map<String, Object> root = webClient.get()
              .uri(uri)
              .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
              .retrieve()
              .bodyToMono(Map.class)
              .block();

      if (root == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "기상청 API 응답이 비어 있습니다."
        );
      }

      Map<String, Object> response = (Map<String, Object>) root.get("response");
      if (response == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "기상청 API 응답에 response가 없습니다."
        );
      }

      Map<String, Object> header = (Map<String, Object>) response.get("header");
      Map<String, Object> body = (Map<String, Object>) response.get("body");

      if (header == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "기상청 API 응답에 header가 없습니다."
        );
      }

      String resultCode = String.valueOf(header.get("resultCode"));
      String resultMsg = String.valueOf(header.get("resultMsg"));

      if (!"00".equals(resultCode)) {
        throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "기상청 API 오류: " + resultMsg
        );
      }

      int totalCount = 0;
      if (body != null && body.get("totalCount") != null) {
        totalCount = Integer.parseInt(String.valueOf(body.get("totalCount")));
      }

      List<UltraSrtFcstItem> items = new ArrayList<>();
      if (body != null && body.get("items") instanceof Map<?, ?> itemsMap) {
        Object itemObj = ((Map<String, Object>) itemsMap).get("item");
        for (Map<String, Object> row : normalizeItemList(itemObj)) {
          items.add(toItem(row));
        }
      }

      return UltraSrtFcstResponse.builder()
              .resultCode(resultCode)
              .resultMsg(resultMsg)
              .totalCount(totalCount)
              .items(items)
              .build();

    } catch (WebClientResponseException e) {
      String responseBody = e.getResponseBodyAsString();
      if (e.getStatusCode().is2xxSuccessful()) {
        throw new ResponseStatusException(
            HttpStatus.BAD_GATEWAY,
            "기상청 응답은 성공(200)이나 본문을 JSON(Map)으로 읽지 못했습니다. "
                + "dataType=JSON 인지 확인하거나 XML을 쓰려면 별도 파서가 필요합니다."
                + (responseBody != null && !responseBody.isBlank()
                    ? " 응답 앞부분: " + responseBody.substring(0, Math.min(120, responseBody.length()))
                    : ""));
      }
      throw new ResponseStatusException(
              HttpStatus.BAD_GATEWAY,
              "기상청 API HTTP 오류: " + e.getStatusCode() +
                      (responseBody != null && !responseBody.isBlank() ? " - " + responseBody : "")
      );
    } catch (ResponseStatusException e) {
      throw e;
    } catch (Exception e) {
      log.error("초단기예보 조회 중 서버 오류", e);
      throw new ResponseStatusException(
              HttpStatus.INTERNAL_SERVER_ERROR,
              "초단기예보 조회 중 서버 오류가 발생했습니다."
      );
    }
  }
}

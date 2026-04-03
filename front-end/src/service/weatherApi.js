import axiosInstance from './axiosInstance';

/**
 * 초단기예보 조회 요청 예시
 * {
 *   baseDate: "20260402",
 *   baseTime: "0630",
 *   nx: 55,
 *   ny: 127,
 *   pageNo: 1,
 *   numOfRows: 100
 * }
 */

/**
 * 초단기예보 응답 예시
 * {
 *   resultCode: "00",
 *   resultMsg: "NORMAL_SERVICE",
 *   totalCount: 60,
 *   items: [
 *     {
 *       category: "T1H",
 *       fcstDate: "20260402",
 *       fcstTime: "0700",
 *       fcstValue: "12",
 *       baseDate: "20260402",
 *       baseTime: "0630",
 *       nx: 55,
 *       ny: 127
 *     }
 *   ]
 * }
 */

/**
 * Spring Boot 백엔드의 초단기예보 API 호출
 * @param {Object} payload - 초단기예보 조회 요청 데이터
 * @param {string} payload.baseDate - 발표일자 (예: 20260402)
 * @param {string} payload.baseTime - 발표시각 (예: 0630)
 * @param {number} payload.nx - 예보지점 X 좌표
 * @param {number} payload.ny - 예보지점 Y 좌표
 * @param {number} [payload.pageNo] - 페이지 번호
 * @param {number} [payload.numOfRows] - 조회 건수
 * @returns {Promise<Object>} 초단기예보 응답 데이터
 */
export const fetchUltraShortForecast = async (payload) => {
  try {
    // 백엔드 API 호출
    const response = await axiosInstance.post(
      `${import.meta.env.VITE_SPRING_IP}/api/weather/ultra-short-forecast`,
      payload
    );
    console.log(response.data);
    // 응답 본문 반환
    return response.data;
  } catch (error) {
    // 실무에서는 에러 로그를 남기고 상위 호출부로 예외를 전달
    console.error('초단기예보 조회 실패:', error);
    throw error;
  }
};
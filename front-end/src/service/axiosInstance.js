import axios from 'axios';
import { getMemberIdFromAccessToken } from './jwtUtil';

/** refresh 실패 후 `/login`에서 세션 만료 안내를 띄울 때 사용 */
export const SESSION_EXPIRED_NOTICE_KEY = 'trip_session_expired_notice';

const axiosInstance = axios.create({
  // 모든 요청 URL의 공통 시작 주소
  baseURL: import.meta.env.VITE_SPRING_IP,
  // 쿠키 기반 인증이 아니라 Authorization헤더 기반 인증이므로 false사용
  withCredentials: false,
});

// api요청이 나가기 전에 실행됨 
// 브라우저 localStorage에서 accessToken 조회
// 토큰이 있으면 Authorization: Bearer ${accessToken} 형식으로 헤더에 추가
// 각 API함수마다 헤더를 직접 넣지 않아도 됨. 
axiosInstance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// 응답 인터셉터: 
// 성공 응답이면 그대로 반환. 실패 응답이면 두 번째 함수 실행 
// 즉 서버 에러나 인증 에러를 한 곳에서 공통 처리함. 
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 원래 요청 정보 보관 
    // 실패 요청의 설정값(URL, method, headers 등) 을 가져옴
    // 이게 있어야 refresh 성공 후 같은 요청을 다시 보낼 수 있음. 
    // 없으면 재시도 불가하므로 그냥 에러 반환함. 
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 403(권한 없음) 또는 401(인증 실패) 에러 처리
    // 보통 access token 만료 상황에서 많이 발생함. 
    if (error.response?.status === 403 || error.response?.status === 401) {
      //무한 재시도 방지. 같은 요청에 대해 refresh를 한 번만 시도하도록 막는 코드 
      // 이 코드가 없다면 재요청, 또 401, 또 refresh, 또 재요청, 무한 반복이 발생할 수 있음. 
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('refreshToken');
        // refreshToken 으로 재발급 요청함 
        // 공통 axiosInstance가 아니라 기본 axios를 사용해서 refresh 호출
        // 이유: axiosInstance를 쓰면 인터셉터가 또 개입할 수 있어 구조가 꼬일 수도 있음. 
        // refresh 요청 까지 다시 refresh 로직에 걸리면 복잡해짐. 
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
              { refreshToken }
            );
            //새 토큰 저장
            // 새 access token에서 member_id를 추출해서 같이 저장함. 
            // 로그인 직 후 뿐 아니라 토큰 재발급 후에도 member_id 최신화 
            // 프론트에서 사용자 식별값이 필요한 경우 활용 가능함. 
            // member_id는 보조 정보로만 쓰고, 권한 체크는 반드시 서버 기준으로 해야 함.  
            const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            const memberId = getMemberIdFromAccessToken(accessToken);
            if (memberId) localStorage.setItem('member_id', memberId);
            // 원래 요청 재실행 
            // 실패했던 요청의 Authorization 헤더를 새 access token으로 교체 
            // 같은 요청을 다시 수행
            // 사용자 입장에서는 자동으로 복구된 것처럼 보임 
            // 사용예: /api/member/me 요청, access token 만료로 401, refresh성공
            // 다시 /api/member/me 요청, 정상 응답 
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
          } catch {
            // refresh실패시 로그아웃 처리 
            // refresh token도 만료되었거나 위조된 경우
            // 더 이상 인증을 유지할 수 없으므로 저장값 삭제
            // 로그인 페이지로 강제 이동 
            // 여기에서 사용자에게 세션이 만료되었습니다. 다시 로그인 해주세요.
            // 알림을 함께 주는 것이 UX에 좋습니다. 
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('member_id');
            try {
              sessionStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, '1');
            } catch {
              /* private 모드 등 */
            }
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

/*
이 코드는 React(Vite) 프론트엔드에서 공통으로 사용하는 axios 인스턴스입니다.
주요 목적은 3가지입니다.

모든 요청에 accessToken 자동 첨부
서버가 401 / 403을 반환하면 refreshToken으로 재발급 시도
재발급 성공 시 원래 요청 자동 재실행

즉, authApi.js, boardApi.js, memberApi.js 같은 여러 API 파일에서 이 axiosInstance를 공통으로 사용하면, 
매번 토큰을 붙이고 만료를 처리하는 로직을 중복 작성하지 않아도 됩니다.

### 전체 흐름 설명 ###
동작 순서는 아래와 같습니다.
1. axios.create()로 공통 인스턴스 생성
2. 요청 전에 localStorage의 accessToken을 꺼내서 Authorization 헤더에 추가
3. 응답에서 401 또는 403 발생 시 토큰 만료로 판단
4. 아직 재시도하지 않은 요청이면 _retry = true 설정
5. refreshToken으로 /api/auth/refresh 호출
6. 새 토큰을 발급받으면 localStorage 갱신
7. 원래 실패했던 요청의 헤더를 새 accessToken으로 바꿔 다시 요청
8. 재발급도 실패하면 로그인 페이지로 이동

이 구조는 실무에서도 많이 쓰는 JWT Access Token + Refresh Token 자동 갱신 패턴입니다.


*/

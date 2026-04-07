import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refreshTokenApi } from '../../service/authApi';

/**
 * 이 코드는 React커스텀 훅 useTokenExpiration 으로, accessToken의 만료를 주기적으로 검사하고,
 * 만료 90초 이내일 때 한 번만 사용자에게 연장 여부를 묻고 동의하면 refresh API로 새 토큰을 
 * 발급 받아 교체하는 역할을 합니다. 
 * 
 * 흐름은 아래와 같습니다. 
 * 1. token전달 
 * 2. jwtDecode로 exp 추출출
 * 3. 현재 시간과 비교
 * - 이미 만료됨 -> isTokenExpired = true 
 * - 유효함 -> isTokenExpired = false 
 * 4. 90초 이하 남음 -> confirm 1회 표시 
 * 5. 동의 시 refreshTokenApi 호출 
 * 6. 새 accessToken / refreshToken 저장 
 * 7. setToken(newAccessToken) 
 * 
 * 중요 포인트 4가지 :
 * - useRef로 중복 confirm 방지지
 * - useRef로 중복 refresh 방지
 * - setInterval로 10초 마다 만료 체크
 * - refresh성공 시 localStorage + React state 둘 다 갱신 
 * 
 * accessToken 만료 여부를 검사하는 커스텀 훅
 *
 * 주요 기능:
 * 1. accessToken을 decode해서 exp(만료시간) 확인
 * 2. 이미 만료되었으면 isTokenExpired = true 반환
 * 3. 만료 90초 전이면 사용자에게 1번만 연장 여부를 묻는다
 * 4. 사용자가 동의하면 refresh API를 호출해 토큰을 재발급한다
 *
 * @param {string|null} token 현재 accessToken
 * @param {(token: string|null) => void} setToken App 상위 상태를 갱신하는 함수
 * @returns {boolean} isTokenExpired 토큰 만료 여부
 */
const useTokenExpiration = (token, setToken) => {
  // refresh 실패 시 로그인 페이지 등으로 이동시키기 위해 사용
  const navigate = useNavigate();

  /**
   * askedRef
   * - 현재 "만료 임박 구간"에서 confirm을 이미 띄웠는지 기록
   * - true면 같은 구간에서 confirm을 다시 띄우지 않음
   * - useRef를 쓴 이유: 값은 유지되지만 렌더링을 발생시키지 않기 때문
   */
  const askedRef = useRef(false);

  /**
   * refreshingRef
   * - refresh API가 현재 실행 중인지 기록
   * - 중복 refresh 요청 방지
   */
  const refreshingRef = useRef(false);

  /**
   * 외부(App 등)에서 사용할 최종 만료 상태
   * - true: 만료됨
   * - false: 아직 유효
   */
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  /**
   * expRef
   * - 현재 accessToken의 exp 값을 저장
   * - state 대신 ref를 사용한 이유:
   *   setState는 비동기라 같은 check() 안에서 즉시 반영되지 않을 수 있음
   */
  const expRef = useRef(0);

  useEffect(() => {
    /**
     * 토큰 만료 여부를 검사하는 함수
     * - 최초 1회 실행
     * - 이후 10초마다 반복 실행
     */
    const check = async () => {
      /**
       * 1. 토큰이 없으면 만료 처리하지 않음
       * - App state와 localStorage가 잠깐 불일치할 때
       *   잘못 만료 처리되는 것을 막기 위한 방어 코드
       */
      if (!token) {
        setIsTokenExpired(false);
        return;
      }

      /**
       * 2. JWT decode 수행
       * - exp(만료 시간)를 얻기 위해 필요
       * - 토큰 형식이 깨졌으면 예외 발생
       */
      let decoded;
      try {
        decoded = jwtDecode(token);

        // decode된 exp 값을 ref에 저장
        expRef.current = decoded.exp;
      } catch (e) {
        // 토큰이 비정상이면 만료로 간주
        console.log(e);
        setIsTokenExpired(true);
        return;
      }

      /**
       * 3. 현재 시간 구하기
       * - JWT exp는 보통 초 단위 epoch time이므로
       *   Date.now() / 1000 으로 맞춤
       */
      const now = Date.now() / 1000;

      /**
       * 4. exp가 없거나 현재 시간보다 작거나 같으면 이미 만료
       */
      if (!decoded?.exp || decoded.exp <= now) {
        setIsTokenExpired(true);
        return;
      }

      /**
       * 5. 여기까지 왔으면 현재 토큰은 유효
       */
      setIsTokenExpired(false);

      /**
       * 6. 남은 시간 계산
       * remain = 만료시각 - 현재시각
       * 단위: 초
       */
      const remain = expRef.current - now;
      console.log(remain);

      /**
       * 7. 만료 임박 조건
       * - 90초 이하 남음
       * - 아직 confirm을 안 띄움
       * - 현재 refresh 진행 중 아님
       *
       * 이 세 조건을 모두 만족할 때만 confirm 표시
       */
      if (remain <= 90 && !askedRef.current && !refreshingRef.current) {
        /**
         * confirm 중복 방지를 위해 먼저 true로 잠금
         * confirm 창 떠 있는 동안 check가 다시 돌아도 중복 팝업 방지
         */
        askedRef.current = true;

        // 사용자에게 토큰 연장 여부 확인
        const agreed = window.confirm('토큰을 연장하시겠습니까?');

        /**
         * 8. 사용자가 동의한 경우에만 refresh 진행
         */
        if (agreed) {
          // refresh 중복 호출 방지 플래그
          refreshingRef.current = true;

          try {
            /**
             * 9. refresh API 호출
             * - refreshToken을 이용해 새 accessToken 발급
             * - 응답 예시:
             *   {
             *     accessToken: '...',
             *     refreshToken: '...'
             *   }
             */
            const res = await refreshTokenApi();
            const newAccessToken = res.accessToken;

            /**
             * 10. localStorage 갱신
             * - 브라우저 저장소의 토큰 교체
             */
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', res.refreshToken);

            /**
             * 11. 새 accessToken decode 후 exp 갱신
             */
            const decoded2 = jwtDecode(newAccessToken);
            expRef.current = decoded2.exp;

            /**
             * 12. App 상위 state도 갱신
             * - 이것이 중요
             * - localStorage만 바꾸면 React 화면은 바로 반응하지 않을 수 있음
             */
            setToken(newAccessToken);

            /**
             * 13. refresh 성공 후 askedRef 초기화
             * - 다음 만료 임박 구간에서는 다시 confirm을 띄울 수 있게 함
             */
            askedRef.current = false;
          } catch (err) {
            /**
             * 14. refresh 실패
             * - refreshToken 만료
             * - 위변조
             * - 서버 오류
             * 등 가능
             *
             * 이 경우 만료 처리 후 로그인 페이지로 이동
             */
            console.log(err);
            setIsTokenExpired(true);
            navigate('/');
          } finally {
            /**
             * 15. refresh 진행 종료
             */
            refreshingRef.current = false;
          }
        }
      } else {
        console.log('remain > 90 ' + remain);

        /**
         * 16. 남은 시간이 다시 90초보다 커지면 askedRef 초기화
         * - 예: refresh 성공으로 exp가 뒤로 늘어난 경우
         * - 이후 다음 임박 구간에서 다시 confirm 가능
         */
        if (remain > 90) askedRef.current = false;
      }
    };

    /**
     * 컴포넌트 마운트 직후 즉시 1회 검사
     */
    check();

    /**
     * 10초마다 반복 검사
     * - 너무 짧으면 불필요한 반복 실행 증가
     * - 너무 길면 만료 직전 대응이 늦어질 수 있음
     */
    const interval = setInterval(check, 1000 * 10);

    /**
     * 언마운트 시 interval 제거
     * - 메모리 누수 방지
     */
    return () => clearInterval(interval);
  }, [token, navigate]);
  // token이 바뀌면 새 토큰 기준으로 다시 검사
  // navigate는 react-hooks 규칙상 dependency에 포함

  /**
   * 외부(App 등)에서는 이 boolean 값만 보고
   * 로그아웃 / 홈 이동 / 안내 처리 등을 할 수 있음
   */
  return isTokenExpired;
};

export default useTokenExpiration;
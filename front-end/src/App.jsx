import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import IsTokenExpiration from './components/auth/IsTokenExpiration'
import AppRouter from './router/AppRouter'
/*
  이 코드는 React앱의 최상위 실행 컴포넌트로, 핵심역할은 단순 화면 출력이 아니라
  인증 상태 관리와 토큰 만료 처리 입니다.  
  역할 4가지
  - localStorage의 accessToken을 React.state로 관리
  - 커스텀 훅 IsTokenExpiration 으로 토큰 만료 여부 확인
  - 다른 컴포넌트에서 로그인/로그아웃 후 토큰이 바뀌면 이벤트로 동기화
  - 토큰이 만료되면 localStorage 정리 후 홈(/)으로 이동 

  즉 흐름은 아래와 같습니다. 
  App 시작 -> localStorage에서 accessToken 읽기 -> token state 저장 
  -> IsTokenExpiration(token, setToken) 호출
  -> 토큰 만료 여부 확인 
    -> 만료 아님 -> AppRouter 렌더링
    -> 만료됨 -> 저장값 삭제 + state초기화 + "/" 이동
*/

/**
 * 앱 최상위 컴포넌트
 *
 * 주요 역할:
 * 1. localStorage의 accessToken을 React state로 관리
 * 2. 토큰 만료 여부 확인
 * 3. 로그인/로그아웃 등으로 바뀐 토큰 값을 이벤트로 동기화
 * 4. 토큰 만료 시 인증 정보 삭제 후 홈으로 이동
 */
const App = () => {
  const navigate = useNavigate();

  /**
   * accessToken을 React state로 관리
   *
   * 이유:
   * - localStorage 값만 바뀌면 React는 자동 렌더링하지 않음
   * - state로 관리해야 setToken 호출 시 화면이 즉시 반응함
   *
   * 초기 렌더링 시 localStorage에서 accessToken을 읽어온다.
   */
  const [token, setToken] = useState(() => {
    const token = localStorage.getItem("accessToken");
    console.log(token);
    return token;
  });

  /**
   * 토큰 만료 여부 확인
   *
   * 예상 역할:
   * - JWT exp 값 검사
   * - 만료 여부 반환
   * - 필요시 내부에서 setToken과 연동 가능
   */
  const isTokenExpired = IsTokenExpiration(token, setToken);
  console.log(isTokenExpired);

  /**
   * 인증 정보 동기화 이벤트 처리
   * 다른 컴포넌트에서 예를 들어:
   * 로그인 성공, 로그아웃, 프로필 갱신 후 토큰 재발급, 헤더에서 사용자 상태 변경
   * 작업을 하면서 localStorage만 바꾸면 App은 자동 반응하지 않습니다. 
   * 그래서 커스텀 이벤트 trip-auth-profile-updated를 발생시키고, App이 그 이벤트를
   * 받아 token state를 다시 맞춥니다. 
   * 즉 이 코드는 전역 인증 상태 동기화 장치 입니다. 
   * 
   * 다른 컴포넌트에서 localStorage의 accessToken이 변경되었을 때
   * App의 token state도 같이 맞춰주기 위한 이벤트 리스너
   *
   * 예:
   * - 로그인 성공 후 accessToken 저장
   * - 로그아웃 후 accessToken 삭제
   * - 토큰 재발급 후 accessToken 갱신
   *
   * 위 작업 후 아래 커스텀 이벤트를 발생시키면 App이 token state를 동기화한다.
   */
  useEffect(() => {
    const syncAccessToken = () => {
      setToken(localStorage.getItem('accessToken'));
    };

    window.addEventListener('trip-auth-profile-updated', syncAccessToken);

    // 컴포넌트 언마운트 시 이벤트 제거
    return () =>
      window.removeEventListener('trip-auth-profile-updated', syncAccessToken);
  }, []);

  /**
   * 토큰이 만료되었을 때 자동 로그아웃 처리
   *
   * 처리 순서:
   * 1. localStorage에 저장된 인증/사용자 정보 삭제
   * 2. token state 초기화
   * 3. 홈("/")으로 이동
   *
   * replace: true
   * - 뒤로가기 시 만료된 보호 페이지 이력이 남지 않게 처리
   */
  useEffect(() => {
    if (!isTokenExpired) return;

    // 인증 관련 저장값 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('member_id');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('trip_auto_login');

    // React state도 함께 초기화
    setToken(null);

    // 홈으로 이동
    navigate('/', { replace: true });
  }, [isTokenExpired, navigate, setToken]);

  return (
    <>
      <div>
        {/* 실제 페이지 라우팅 렌더링 */}
        <AppRouter />
      </div>
    </>
  )
}

export default App

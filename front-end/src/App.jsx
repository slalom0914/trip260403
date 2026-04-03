import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderTrip from './components/include/HeaderTrip'
import IsTokenExpiration from './components/auth/IsTokenExpiration'
import AppRouter from './router/AppRouter'
const App = () => {
  const navigate = useNavigate();
  // ✅ 토큰을 state로 관리해야 localStorage 변경 시 화면이 반응함
  const [token, setToken] = useState(() => {
    const token = localStorage.getItem("accessToken");
    console.log(token);
    return token;
  });
  //TODO - 토큰 유효시간 체크 - 파기/유지
  const isTokenExpired = IsTokenExpiration(token, setToken);
  console.log(isTokenExpired);

  /** HeaderTrip 등에서 localStorage만 갱신한 뒤 App의 token state와 훅 입력을 맞춤 */
  useEffect(() => {
    const syncAccessToken = () => {
      setToken(localStorage.getItem('accessToken'));
    };
    window.addEventListener('trip-auth-profile-updated', syncAccessToken);
    return () =>
      window.removeEventListener('trip-auth-profile-updated', syncAccessToken);
  }, []);

  /**
   * ✅ "호출한 쪽"에서 이 값을 받아서
   * 만료면 로그아웃/페이지 이동 처리 가능
   */
  useEffect(() => {
    if (!isTokenExpired) return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('member_id');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('trip_auto_login');
    setToken(null);
    navigate('/', { replace: true });
  }, [isTokenExpired, navigate, setToken]);  
  return (
    <>
      <div>
        <AppRouter />
      </div>
    </>
  )
}

export default App

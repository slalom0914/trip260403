import React from 'react'
import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'

/** `AppRouter`에서 로그인 없이 열리는 경로와 동일하게 유지 */
const PUBLIC_PATHS_WITHOUT_AUTH = new Set(['/home', '/weather', '/error'])

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute = ({ children }) => {
  // 현재 사용자가 접근하려는 경로 정보
  const location = useLocation()

  // localStorage에서 accessToken 조회
  const token = window.localStorage.getItem('accessToken')

  const allowWithoutToken = PUBLIC_PATHS_WITHOUT_AUTH.has(location.pathname)

  // 토큰이 없으면 로그인 페이지로 이동
  // replace: 브라우저 뒤로가기 시 보호 페이지 이력이 남지 않도록 처리
  // state.from: 로그인 성공 후 원래 가려던 페이지로 복귀할 때 사용 가능
  /*
  ProtectedRoute.jsx에 PUBLIC_PATHS_WITHOUT_AUTH(/home, /weather, /error)를 두었고, 토큰이 없어도 
  이 경로들이면 Navigate 없이 children(App → AppRouter)을 그대로 렌더하도록 했습니다.
  AppRouter.jsx의 공개 라우트 목록과 항상 같게 유지하면 됩니다. 
  새 공개 경로를 추가할 때는 두 파일 모두 반영하는 것이 좋습니다.
  */
  if (!token && !allowWithoutToken) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  // 토큰이 있으면 자식 컴포넌트 렌더링
  return children
}

ProtectedRoute.propTypes = {
  // 보호할 자식 컴포넌트
  children: PropTypes.node.isRequired,
}

export default ProtectedRoute
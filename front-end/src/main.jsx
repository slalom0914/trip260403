import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { App as AntdApp } from 'antd'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'antd/dist/antd.css';
import 'react-quill-new/dist/quill.snow.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/pages/HomePage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import KakaoRedirect from './components/auth/KakaoRedirect.jsx';
import GoogleRedirect from './components/auth/GoogleRedirect.jsx';
import NaverRedirect from './components/auth/NaverRedirect.jsx';
/*
인증이 필요한 페이지와 아닌 페이지를 분리 
전체 흐름은 : 
브라우저 진입 -> main.jsx 실행 ->  BrowserRouter 적용 -> AntdApp 적용 -> Routes 분기
*/
createRoot(document.getElementById('root')).render(
  <>
    <BrowserRouter>
      {/* App.useApp() / message·modal·notification는 <App> 하위에서만 동작 */}
      <AntdApp>
        <Routes>
          <Route path="/" element={<HomePage />}/>
          {/* SNS OAuth 콜백: 토큰 없이 접근 → ProtectedRoute에 걸리면 / 로 튕겨나감 */}
          <Route path="/oauth/kakao/redirect" element={<KakaoRedirect />} />
          <Route path="/oauth/google/redirect" element={<GoogleRedirect />} />
          <Route path="/oauth/naver/redirect" element={<NaverRedirect />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AntdApp>
    </BrowserRouter>
  </>,
)

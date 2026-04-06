import { Layout, Form, App } from 'antd';
const { Header } = Layout;
import {
  CloudSun,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPinned,
  Plane,
  UserCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import LoginModal from '../auth/LoginModal';
import SignUp from '../admin/amember/SignUp';
import { getMemberIdFromAccessToken } from '../../service/jwtUtil';
import { loginApi, logoutApi } from '../../service/authApi';
import '../css/global.css';
import { SESSION_EXPIRED_NOTICE_KEY } from '../../service/axiosInstance';

const ROLE_ADMIN = 'ROLE_ADMIN';

const HeaderTrip = () => {
  const [loginError, setLoginError] = useState('');
  const { message } = App.useApp();
  const [loginForm] = Form.useForm();
  const [memberForm] = Form.useForm();
  const profileImageFileList = Form.useWatch('profileImage', memberForm);
  const [signUpModalOpen, setSignUpModalOpen] = useState(false);
  const [memberRegisterSubmitting, setMemberRegisterSubmitting] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_EXPIRED_NOTICE_KEY)) {
      sessionStorage.removeItem(SESSION_EXPIRED_NOTICE_KEY);
      message.warning('세션이 만료되었습니다. 다시 로그인 해주세요.');
    }
  }, [message]);

  const navigate = useNavigate();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() =>
    Boolean(localStorage.getItem('member_id')),
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem('role') ?? '',
  );
  const isAdmin = isLoggedIn && userRole === ROLE_ADMIN;

  const closeLoginModal = () => {
    setLoginModalOpen(false);
    setLoginError('');
    loginForm.resetFields();
  };

  const closeSignUpModal = () => {
    memberForm.resetFields();
    setSignUpModalOpen(false);
  };

  const openSignUpFromLogin = () => {
    setSignUpModalOpen(true);
  };

  const afterSignUpSuccessOpenLogin = () => {
    setLoginModalOpen(true);
  };

  const handleLoginSubmit = async (values) => {
    setLoginError('');
    setLoginSubmitting(true);
    try {
      const result = await loginApi({
        email: values.email.trim(),
        password: values.password,
      });
      console.log(result);
      console.log(result.accessToken);
      const memberId =
        result.member_id ?? getMemberIdFromAccessToken(result.accessToken);
      if (memberId != null && memberId !== '') {
        localStorage.setItem('member_id', String(memberId));
      }
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      localStorage.setItem('email', result.email);
      localStorage.setItem('name', result.name);
      localStorage.setItem('role', result.role);
      localStorage.setItem('profile_image', result.profile_image);
      localStorage.setItem('social_type', result.social_type ?? 'LOCAL');
      if (values.autoLogin) {
        localStorage.setItem('trip_auto_login', '1');
      } else {
        localStorage.removeItem('trip_auto_login');
      }
      window.dispatchEvent(new Event('trip-auth-profile-updated'));
      setIsLoggedIn(true);
      setUserRole(String(result.role ?? ''));
      message.success('로그인되었습니다.');
      closeLoginModal();
      navigate(result.role === ROLE_ADMIN ? '/admin' : '/home');
    } catch (error) {
      console.error('로그인 실패:', error);
      const status = error?.response?.status;
      const body = error?.response?.data;
      let msg = null;
      if (body && typeof body === 'object') {
        msg = body.message || body.detail || body.title || null;
      } else if (typeof body === 'string' && body.trim()) {
        msg = body.trim();
      }
      const defaultUnauthorized =
        '이메일 또는 비밀번호가 올바르지 않습니다.';
      const defaultOther =
        '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
      setLoginError(
        msg || (status === 401 ? defaultUnauthorized : defaultOther),
      );
    } finally {
      setLoginSubmitting(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('member_id')) {
      const mid = getMemberIdFromAccessToken(localStorage.getItem('accessToken'));
      if (mid) localStorage.setItem('member_id', mid);
    }
    setIsLoggedIn(Boolean(localStorage.getItem('member_id')));
    setUserRole(localStorage.getItem('role') ?? '');
    const sync = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('member_id')));
      setUserRole(localStorage.getItem('role') ?? '');
    };
    window.addEventListener('storage', sync);
    const onAuthProfile = () => {
      setIsLoggedIn(Boolean(localStorage.getItem('member_id')));
      setUserRole(localStorage.getItem('role') ?? '');
    };
    window.addEventListener('trip-auth-profile-updated', onAuthProfile);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('trip-auth-profile-updated', onAuthProfile);
    };
  }, []);

  const handleLogout = async () => {
    const email = localStorage.getItem('email');
    const accessToken = localStorage.getItem('accessToken');
    try {
      if (email && accessToken) {
        await logoutApi({ email, accessToken });
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('member_id');
      localStorage.removeItem('email');
      localStorage.removeItem('name');
      localStorage.removeItem('role');
      localStorage.removeItem('profile_image');
      localStorage.removeItem('social_type');
      localStorage.removeItem('trip_auto_login');
      window.dispatchEvent(new Event('trip-auth-profile-updated'));
      setIsLoggedIn(false);
      setUserRole('');
      navigate('/', { replace: true });
    }
  };

  return (
    <Header
      className="header-trip"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 'auto',
        lineHeight: 1.2,
      }}
    >
      <Link to="/" className="header-trip__brand">
        <Plane size={36} strokeWidth={2} aria-hidden />
        <span className="header-trip__brand-title">
          PLAN <span className="header-trip__brand-accent">A</span>
        </span>
      </Link>
      <nav className="header-trip__nav" aria-label="주요 메뉴">
        {isAdmin ? (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `header-trip__nav-item${isActive ? ' header-trip__nav-item--active' : ''}`
            }
          >
            <LayoutDashboard size={24} strokeWidth={2} aria-hidden />
            <span className="header-trip__nav-label">관리자 페이지</span>
          </NavLink>
        ) : null}
        <NavLink
          to="/myplan"
          className={({ isActive }) =>
            `header-trip__nav-item${isActive ? ' header-trip__nav-item--active' : ''}`
          }
        >
          <MapPinned size={24} strokeWidth={2} aria-hidden />
          <span className="header-trip__nav-label">내 여행</span>
        </NavLink>
        <NavLink
          to="/weather"
          className={({ isActive }) =>
            `header-trip__nav-item${isActive ? ' header-trip__nav-item--active' : ''}`
          }
        >
          <CloudSun size={24} strokeWidth={2} aria-hidden />
          <span className="header-trip__nav-label">날씨정보</span>
        </NavLink>
        <NavLink
          to="/myprofile"
          className={({ isActive }) =>
            `header-trip__nav-item${isActive ? ' header-trip__nav-item--active' : ''}`
          }
        >
          <UserCircle size={24} strokeWidth={2} aria-hidden />
          <span className="header-trip__nav-label">내 프로필</span>
        </NavLink>
        {isLoggedIn ? (
          <button
            type="button"
            className="header-trip__nav-item"
            onClick={handleLogout}
          >
            <LogOut size={24} strokeWidth={2} aria-hidden />
            <span className="header-trip__nav-label">로그아웃</span>
          </button>
        ) : (
          <button
            type="button"
            className="header-trip__nav-item"
            onClick={() => setLoginModalOpen(true)}
          >
            <LogIn size={24} strokeWidth={2} aria-hidden />
            <span className="header-trip__nav-label">로그인</span>
          </button>
        )}
      </nav>
      <LoginModal
        open={loginModalOpen}
        onClose={closeLoginModal}
        form={loginForm}
        onFinish={handleLoginSubmit}
        submitting={loginSubmitting}
        onRequestSignUp={openSignUpFromLogin}
        loginError={loginError}
      />
      <SignUp
        memberRegisterModalOpen={signUpModalOpen}
        closeMemberRegisterModal={closeSignUpModal}
        memberForm={memberForm}
        profileImageFileList={profileImageFileList}
        memberRegisterSubmitting={memberRegisterSubmitting}
        setMemberRegisterSubmitting={setMemberRegisterSubmitting}
        onRegisterSuccess={afterSignUpSuccessOpenLogin}
      />
    </Header>
  );
};

export default HeaderTrip;

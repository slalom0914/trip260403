import React from 'react';
import { Modal, Form, Input, Button, Checkbox, App, Alert } from 'antd';
import styles from './login.module.css';
import '../css/global.css';
const LoginModal = ({
  open,
  onClose,
  form,
  onFinish,
  submitting,
  onRequestSignUp,
  loginError = '',
}) => {
  const { message } = App.useApp();

  const naverLogin = () => {
    console.log('naverLogin');
  }
  const kakaoLogin = () => {
    console.log('kakaoLogin');
    
    const kakaoUrl = "https://kauth.kakao.com/oauth/authorize"
    const kakaoClientId = "4b140cf1d4428a43b2d0318382e7b264" //rest api key
    const kakaoRedirectUrl = "http://localhost:5173/oauth/kakao/redirect"
    try{
        const auth_uri = `${kakaoUrl}?client_id=${kakaoClientId}&redirect_uri=${kakaoRedirectUrl}&response_type=code`
        window.location.href = auth_uri
    }catch(error){
        console.error("카카오 인증코드 가져오기 실패", error)
    }    
  }
  const googleLogin = () => {
    console.log('googleLogin');
    const googleUrl = "https://accounts.google.com/o/oauth2/v2/auth"
    const googleClientId = `${import.meta.env.VITE_GOOGLE_CLIENTID}`
    //구글서버에서 요청(인가코드보내줘)을 듣고 응답으로 보내줄 URL 미리 등록해 둠
    //구글서버에게 요청을 하게 되면 응답페이지 처리에 대한 제어권이 구글에게 넘어감
    //그래서 미리 응답을 받을 수 있도록 redirecturl을 통해서 쿼리스트링으로
    //인가코드를 넘겨준다.
    //인가코드를 받아서(5173번) 스프링 부트 서버(8000번)에 요청을 전달함.
    const googleRedirectUrl = "http://localhost:5173/oauth/google/redirect"
    const googleScope = "openid profile email"
    try {
        const auth_uri = `${googleUrl}?client_id=${googleClientId}&redirect_uri=${googleRedirectUrl}&response_type=code&scope=${googleScope}`
        console.log(auth_uri);
        // 브라우저 없이 구글 서버에 요청하기
        window.location.href=auth_uri
    } catch (error) {
        console.error("구글 로그인 실패!!!", error);
    }    
  }
  return (
    <Modal
      title="로그인"
      open={open}
      onCancel={onClose}
      footer={null}
      width={300}
      styles={{ header: { textAlign: 'center' } }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}
        initialValues={{ autoLogin: false }}
        style={{ marginTop: 14 }}
      >
        <Form.Item
          name="email"
          style={{ marginBottom: 5 }}
          rules={[
            { required: true, message: '이메일을 입력하세요.' },
            { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
          ]}
        >
          <Input placeholder="이메일" autoComplete="username" />
        </Form.Item>
        <Form.Item
          name="password"
          style={{ marginTop: 0, marginBottom: 0 }}
          rules={[{ required: true, message: '비밀번호를 입력하세요.' }]}
        >
          <Input.Password placeholder="비밀번호" autoComplete="current-password" />
        </Form.Item>
        <Form.Item style={{ marginTop: 0, marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Form.Item name="autoLogin" valuePropName="checked" noStyle>
              <Checkbox style={{ fontSize: 12 }}>자동 로그인</Checkbox>
            </Form.Item>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', fontSize: 12 }}
              onClick={() =>
                message.info('비밀번호 찾기 기능은 준비 중입니다.')
              }
            >
              비밀번호 찾기
            </Button>
          </div>
        </Form.Item>
        {loginError ? (
          <Alert
            type="error"
            showIcon
            title={loginError}
            style={{ marginBottom: 12 }}
          />
        ) : null}
        <Form.Item style={{ marginTop: 0, marginBottom: 12 }}>
          <Button
            block
            htmlType="submit"
            loading={submitting}
            className={styles.submitGray}
          >
            로그인
          </Button>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <div
            className={styles.snsCaption}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            SNS 계정으로 시작하기
          </div>
        </Form.Item>
        <Form.Item style={{ marginTop: 0, marginBottom: 4 }}>
          <Button
            block
            htmlType="button"
            className={styles.submitNaver}
            onClick={naverLogin}
          >
            네이버 계정으로 시작
          </Button>
        </Form.Item>
        <Form.Item style={{ marginTop: 0, marginBottom: 4 }}>
          <Button
            block
            htmlType="button"
            className={styles.submitKakao}
            onClick={kakaoLogin}
          >
            카카오 계정으로 시작
          </Button>
        </Form.Item>
        <Form.Item style={{ marginTop: 0, marginBottom: 12 }}>
          <Button
            block
            htmlType="button"
            className={styles.submitGoogle}
            onClick={googleLogin}
          >
            구글 계정으로 시작
          </Button>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <div
            className={styles.snsCaption}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            아직 계정이 없으신가요?
          </div>
        </Form.Item>
        <Form.Item style={{ marginTop: 0, marginBottom: 12 }}>
          <Button
            block
            htmlType="button"
            className={styles.submitGray}
            onClick={() => {
              onClose();
              onRequestSignUp?.();
            }}
          >
            이메일로 회원가입
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LoginModal;

import React, { useState } from 'react'
import { Form, Input, Select, Modal, Upload, App, theme, Button } from 'antd'
import { Plus } from 'lucide-react'
import { existsNicknameApi, memberInsertApi } from '../../../service/memberApi'
import styles from './signup.module.css'

/**
 * Upload의 onChange 이벤트 값을
 * Ant Design Form이 기대하는 fileList 배열 형태로 변환
 */
const normFile = (e) => {
  if (Array.isArray(e)) return e
  return e?.fileList ?? []
}

/**
 * 서버 저장용 권한 매핑
 * 폼 value와 API value를 통일하면 가장 좋지만,
 * 현재 구조를 유지한다면 안전하게 매핑 처리
 */
const ROLE_TO_API = {
  ROLE_MEMBER: 'ROLE_MEMBER',
  ROLE_MANAGER: 'ROLE_MANAGER',
  ROLE_ADMIN: 'ROLE_ADMIN',
}

/**
 * 서버 저장용 상태 매핑
 */
const STATUS_TO_API = {
  활성: 'active',
  정지: 'suspended',
  탈퇴: 'withdrawn',
}

/**
 * axios / 서버 오류 객체에서 사용자에게 보여줄 메시지 추출
 */
function formatRegisterFailureMessage(error) {
  const data = error?.response?.data
  const status = error?.response?.status
  const reasons = []

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (data.message) reasons.push(String(data.message).trim())

    const errStr = data.error != null ? String(data.error).trim() : ''
    if (errStr && errStr !== String(data.message || '').trim()) {
      reasons.push(errStr)
    }

    const detailStr = data.detail != null ? String(data.detail).trim() : ''
    if (detailStr && !reasons.includes(detailStr)) {
      reasons.push(detailStr)
    }

    if (Array.isArray(data.errors)) {
      data.errors.forEach((x) => {
        const text =
          typeof x === 'string'
            ? x
            : x?.defaultMessage ?? x?.message ?? x?.field

        if (text) reasons.push(String(text).trim())
      })
    }
  } else if (typeof data === 'string' && data.trim()) {
    reasons.push(data.trim())
  }

  const uniqueReasons = [...new Set(reasons.filter(Boolean))]
  const reasonStr = uniqueReasons.length > 0 ? uniqueReasons.join(' · ') : null

  if (reasonStr) {
    return { title: '회원가입에 실패했습니다.', reason: reasonStr }
  }

  if (error?.message && !error?.response) {
    return { title: '회원가입에 실패했습니다.', reason: error.message }
  }

  if (status != null) {
    return {
      title: '회원가입에 실패했습니다.',
      reason: `서버 응답 코드 ${status}`,
    }
  }

  return {
    title: '회원가입에 실패했습니다.',
    reason: '일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.',
  }
}

const SignUp = ({
  memberRegisterModalOpen,
  closeMemberRegisterModal,
  memberForm,
  memberRegisterSubmitting,
  setMemberRegisterSubmitting,
  onRegisterSuccess,
}) => {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const { colorTextSecondary } = token
  const [nicknameChecking, setNicknameChecking] = useState(false)

  const handleNicknameDuplicateCheck = async () => {
    try {
      await memberForm.validateFields(['nickname'])
    } catch {
      return
    }
    const nickname = (memberForm.getFieldValue('nickname') ?? '').trim()
    setNicknameChecking(true)
    try {
      const { exists } = await existsNicknameApi(nickname)
      if (exists) {
        message.error('이미 사용 중인 닉네임입니다.')
      } else {
        message.success('사용 가능한 닉네임입니다.')
      }
    } catch {
      message.error('중복 확인 중 오류가 발생했습니다.')
    } finally {
      setNicknameChecking(false)
    }
  }

  /**
   * 회원가입 제출 처리
   */
  const handleMemberRegisterSubmit = async () => {
    try {
      // 1. 폼 유효성 검사
      const values = await memberForm.validateFields()
      setMemberRegisterSubmitting(true)

      // 2. 권한 / 상태 값 서버용으로 변환
      const roleValue = ROLE_TO_API[values.role] ?? values.role
      const statusValue = STATUS_TO_API[values.status] ?? 'active'

      // 3. 업로드된 파일 정보 추출
      // Upload는 fileList 배열 구조이므로 첫 번째 파일만 사용
      const uploadItem = values.profile_image?.[0] ?? null

      // 실제 브라우저 File 객체
      const file = uploadItem?.originFileObj ?? null

      // 업로드 컴포넌트에 표시되는 파일명
      // 없으면 실제 File 객체의 name 사용
      const profileImageName = uploadItem?.name ?? file?.name ?? ''

      console.log('선택된 파일 객체:', file)
      console.log('선택된 프로필 이미지 이름:', profileImageName)

      // 4. multipart/form-data 생성
      const formData = new FormData()
      formData.append('member_id', values.member_id)
      formData.append('email', values.email)
      formData.append('password', values.password)
      formData.append('name', values.name)
      formData.append('nickname', values.nickname)
      formData.append('social_type', values.social_type ?? 'LOCAL')
      formData.append('role', roleValue)
      formData.append('status', statusValue)

      // 5. 파일이 있으면 파일 자체와 파일명 모두 함께 전송
      if (file) {
        //formData.append('profile_image', profileImageName)
        formData.append('profile_image', file)
        formData.append('profile_image_name', profileImageName)
      }

      // 디버깅용: FormData 전체 확인
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      // 실제 API 호출
      await memberInsertApi(formData)

      message.success('회원가입이 완료되었습니다.')

      // 6. 성공 후 폼 초기화 및 모달 닫기
      memberForm.resetFields()
      closeMemberRegisterModal()
      onRegisterSuccess?.()
    } catch (e) {
      // Ant Design validateFields 실패는 서버 오류가 아니므로 종료
      if (e?.errorFields) return

      const { title, reason } = formatRegisterFailureMessage(e)
      message.error(`${title} 사유: ${reason}`)
    } finally {
      setMemberRegisterSubmitting(false)
    }
  }

  return (
    <Modal
      title="회원가입"
      open={memberRegisterModalOpen}
      onCancel={closeMemberRegisterModal}
      onOk={handleMemberRegisterSubmit}
      confirmLoading={memberRegisterSubmitting}
      okText="가입"
      cancelText="취소"
      centered
      width={400}
      styles={{
        header: { textAlign: 'center' },
        footer: { textAlign: 'center' },
      }}
    >
      <Form
        className={styles.signUpForm}
        form={memberForm}
        layout="horizontal"
        labelAlign="left"
        labelCol={{ flex: '0 0 120px' }}
        wrapperCol={{ flex: '1 1 auto' }}
        initialValues={{
          social_type: 'LOCAL',
          role: 'ROLE_MEMBER', // Select option 값과 동일하게 수정
          status: '활성',
          profile_image: [],
        }}
      >
        <Form.Item
          name="member_id"
          label="회원 ID"
          rules={[
            { required: true, message: '회원 ID를 입력하세요.' },
            { max: 50, message: '최대 50자까지 입력 가능합니다.' },
          ]}
        >
          <Input
            className={styles.inputHalf}
            placeholder="예: user01"
            autoComplete="off"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="이메일"
          rules={[
            { required: true, message: '이메일을 입력하세요.' },
            { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
            { max: 255, message: '최대 255자까지 입력 가능합니다.' },
          ]}
        >
          <Input
            placeholder="example@test.com"
            autoComplete="off"
            className={styles.inputHalf}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="비밀번호"
          rules={[
            { required: true, message: '비밀번호를 입력하세요.' },
            { max: 255, message: '최대 255자까지 입력 가능합니다.' },
          ]}
          extra="저장 시 서버에서 암호화 처리합니다."
        >
          <Input.Password
            placeholder="비밀번호"
            autoComplete="new-password"
            className={styles.inputHalf}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="비밀번호 확인"
          dependencies={['password']}
          rules={[
            { required: true, message: '비밀번호 확인을 입력하세요.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(
                  new Error('비밀번호가 서로 일치하지 않습니다.')
                )
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
            className={styles.inputHalf}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="이름"
          rules={[
            { required: true, message: '이름을 입력하세요.' },
            { max: 50, message: '최대 50자까지 입력 가능합니다.' },
          ]}
        >
          <Input placeholder="이름" className={styles.inputHalf} />
        </Form.Item>

        <Form.Item label="닉네임" className={styles.nicknameFormItem}>
          <div className={styles.nicknameRow}>
            <Form.Item
              name="nickname"
              noStyle
              rules={[
                { required: true, message: '닉네임을 입력하세요.' },
                { max: 50, message: '최대 50자까지 입력 가능합니다.' },
              ]}
            >
              <Input placeholder="닉네임" className={styles.nicknameInput} />
            </Form.Item>
            <Button
              type="default"
              loading={nicknameChecking}
              onClick={handleNicknameDuplicateCheck}
              className={styles.nicknameCheckBtn}
            >
              중복확인
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="프로필 이미지">
          <div className={styles.profileUploadRow}>
            <Form.Item
              name="profile_image"
              noStyle
              valuePropName="fileList"
              getValueFromEvent={normFile}
              rules={[
                {
                  validator: async (_, fileList) => {
                    const f = fileList?.[0]?.originFileObj
                    if (f && f.size > 5 * 1024 * 1024) {
                      return Promise.reject(
                        new Error('파일 크기는 5MB 이하여야 합니다.')
                      )
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                accept="image/*"
                beforeUpload={(file) => {
                  const isImg = file.type.startsWith('image/')
                  if (!isImg) {
                    message.error('이미지 파일만 선택할 수 있습니다.')
                    return Upload.LIST_IGNORE
                  }
                  // 자동 업로드 방지, Form에서 관리
                  return false
                }}
              >
                {/* Upload 내부 표시 여부는 Form 값 기준으로 처리하는 것이 가장 안정적 */}
                {(memberForm.getFieldValue('profile_image')?.length ?? 0) >= 1 ? null : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      color: colorTextSecondary,
                    }}
                  >
                    <Plus size={22} strokeWidth={2} aria-hidden />
                    <span style={{ fontSize: 12 }}>이미지 선택</span>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <div
              className={styles.profileUploadHint}
              style={{ color: colorTextSecondary }}
            >
              이미지 파일을 선택하세요.
              <br />
              (JPG, PNG, GIF 등 · 최대 5MB)
            </div>
          </div>
        </Form.Item>

        <Form.Item name="social_type" label="로그인 타입">
          <Select
            allowClear
            placeholder="선택 (미선택 시 LOCAL)"
            className={styles.inputHalf}
            options={[
              { value: 'LOCAL', label: 'LOCAL' },
              { value: 'GOOGLE', label: 'GOOGLE' },
              { value: 'KAKAO', label: 'KAKAO' },
              { value: 'NAVER', label: 'NAVER' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="role"
          label="권한"
          rules={[{ required: true, message: '권한을 선택하세요.' }]}
        >
          <Select
            className={styles.inputHalf}
            options={[
              { value: 'ROLE_MEMBER', label: 'MEMBER' },
              { value: 'ROLE_MANAGER', label: 'MANAGER' },
              { value: 'ROLE_ADMIN', label: 'ADMIN' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="상태"
          rules={[{ required: true, message: '상태를 선택하세요.' }]}
        >
          <Select
            className={styles.inputHalf}
            options={[
              { value: '활성', label: '활성' },
              { value: '정지', label: '정지' },
              { value: '탈퇴', label: '탈퇴' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default SignUp
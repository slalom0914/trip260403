import React, { useEffect, useState } from 'react'
import HeaderTrip from '../../include/HeaderTrip'
import MemberList from '../amember/MemberList'
import SignUp from '../amember/SignUp'
import '../../css/global.css'
import adminAvatar from '../../../assets/avatar/admin.png'
import {
  Layout,
  Menu,
  Breadcrumb,
  theme,
  ConfigProvider,
  Form,
} from 'antd'
import {
  Activity,
  ChartColumn,
  ClipboardList,
  FileUp,
  LayoutDashboard,
  LineChart,
  List,
  Map,
  MapPinned,
  Search,
  UserPlus,
  Users,
} from 'lucide-react'

/** localStorage `profile_image`(서버 pds 파일명) 없으면 기본 아바타 */
function getAdminSidebarProfileSrc(springBaseUrl) {
  const name = localStorage.getItem('profile_image')?.trim()
  if (!name || name === 'null' || name === 'undefined') {
    return adminAvatar
  }
  return `${springBaseUrl}/pds/${name}`
}

/**
 * LOCAL: `profile_image`를 pds 파일명으로 보고 스프링 `/pds/...` URL 사용.
 * 그 외 계정(SNS 등): localStorage `profile_image` 값을 그대로 src로 사용(보통 전체 URL).
 * `social_type` 미저장 시: `profile_image`가 http(s)로 시작하면 SNS URL로 간주.
 */
function resolveAdminSidebarProfileSrc(springBaseUrl) {
  const socialType = (localStorage.getItem('social_type') || '').trim().toUpperCase()
  const stored = localStorage.getItem('profile_image')?.trim()

  const isLocalAccount =
    socialType === 'LOCAL' ||
    (!socialType &&
      (stored == null ||
        stored === '' ||
        stored === 'null' ||
        stored === 'undefined' ||
        !/^https?:\/\//i.test(stored)))

  if (isLocalAccount) {
    return getAdminSidebarProfileSrc(springBaseUrl)
  }
  if (!stored || stored === 'null' || stored === 'undefined') {
    return adminAvatar
  }
  return stored
}

const { Content, Sider } = Layout

const menuIconProps = { size: 14, strokeWidth: 2, 'aria-hidden': true }

const items2 = [
  {
    key: 'sub1',
    label: '회원관리',
    icon: <Users {...menuIconProps} />,
    children: [
      { key: '1', label: '회원목록', icon: <ClipboardList {...menuIconProps} /> },
      { key: '2', label: '회원등록', icon: <UserPlus {...menuIconProps} /> },
    ],
  },
  {
    key: 'sub2',
    label: '이용현황',
    icon: <Activity {...menuIconProps} />,
    children: [
      { key: '3', label: '요약', icon: <LayoutDashboard {...menuIconProps} /> },
      { key: '4', label: '이용자 통계', icon: <ChartColumn {...menuIconProps} /> },
      { key: '5', label: '지역 검색 통계', icon: <MapPinned {...menuIconProps} /> },
      { key: '6', label: '검색어 통계', icon: <Search {...menuIconProps} /> },
      { key: '7', label: '이용 통계', icon: <LineChart {...menuIconProps} /> },
    ],
  },
  {
    key: 'sub3',
    label: '장소관리',
    icon: <Map {...menuIconProps} />,
    children: [
      { key: '8', label: '장소목록', icon: <List {...menuIconProps} /> },
      { key: '9', label: '파일 업로드(.csv)', icon: <FileUp {...menuIconProps} /> },
    ],
  },
]

const pageTitleMap = {
  '1': '회원목록',
  '3': '요약',
  '4': '이용자 통계',
  '5': '지역 검색 통계',
  '6': '검색어 통계',
  '7': '이용 통계',
  '8': '장소목록',
  '9': '파일 업로드(.csv)',
}

/** 메뉴 키별 본문 영역 안내 (추후 각 페이지 컴포넌트로 교체 가능) */
const contentDescriptionMap = {
  '1': '등록된 회원 목록을 조회·검색·관리하는 화면입니다.',
  '3': '서비스 이용 현황을 한눈에 볼 수 있는 요약 화면입니다.',
  '4': '이용자 수·접속 등 통계를 확인하는 화면입니다.',
  '5': '지역별 검색 현황 통계를 확인하는 화면입니다.',
  '6': '인기 검색어 등 검색어 통계를 확인하는 화면입니다.',
  '7': '이용 패턴·기간별 이용 통계를 확인하는 화면입니다.',
  '8': '등록된 장소 목록을 조회·관리하는 화면입니다.',
  '9': 'CSV 파일을 선택해 장소 데이터를 일괄 업로드하는 화면입니다.',
}

/** Breadcrumb 중간 구간: 회원관리(1) / 이용현황(3~7) / 장소관리(8·9) — 회원등록(2)은 본문 없이 모달만 사용 */
const breadcrumbParentMap = {
  '1': '회원관리',
  '3': '이용현황',
  '4': '이용현황',
  '5': '이용현황',
  '6': '이용현황',
  '7': '이용현황',
  '8': '장소관리',
  '9': '장소관리',
}

const normFile = (e) => {
  if (Array.isArray(e)) return e
  return e?.fileList ?? []
}

const readProfileFromStorage = () => ({
  name: (localStorage.getItem('name') || '').trim(),
  email: (localStorage.getItem('email') || '').trim(),
})

const AdminPage = () => {
  const [selectedKeys, setSelectedKeys] = useState(['1'])
  const [memberRegisterModalOpen, setMemberRegisterModalOpen] = useState(false)
  const [memberRegisterSubmitting, setMemberRegisterSubmitting] = useState(false)
  const [memberForm] = Form.useForm()
  const profileImageFileList = Form.useWatch('profile_image', memberForm)
  const [profileName, setProfileName] = useState(() => readProfileFromStorage().name)
  const [profileEmail, setProfileEmail] = useState(() => readProfileFromStorage().email)
  const { token } = theme.useToken()

  useEffect(() => {
    const sync = () => {
      const { name, email } = readProfileFromStorage()
      setProfileName(name)
      setProfileEmail(email)
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  const {
    colorBgContainer,
    borderRadiusLG,
    colorText,
    colorTextSecondary,
    colorSplit,
  } = token

  const key = selectedKeys[0]
  const currentParentTitle = breadcrumbParentMap[key] ?? '회원관리'
  const currentPageTitle = pageTitleMap[key] ?? pageTitleMap['1']
  const currentContentDescription =
    contentDescriptionMap[key] ?? contentDescriptionMap['1']

  const closeMemberRegisterModal = () => {
    memberForm.resetFields()
    setMemberRegisterModalOpen(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <HeaderTrip />
      <Layout style={{ flex: 1, minHeight: 0, width: '100%' }}>
        <Layout style={{ flex: 1, minHeight: 0, width: '100%' }}>
          {/* Menu 색상 커스터마이징 */}
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  /* 기본 메뉴 글자색 */
                  itemColor: '#000000',

                  /* hover 시 글자색 */
                  itemHoverColor: '#000000',

                  /* 선택된 메뉴 글자색 */
                  itemSelectedColor: '#000000',

                  /* 서브메뉴 내부 선택 글자색 */
                  subMenuItemSelectedColor: '#000000',

                  /* 선택된 메뉴 배경색 */
                  itemSelectedBg: '#f5f5f5',

                  /* hover 배경색 */
                  itemHoverBg: '#f0f0f0',
                },
              },
            }}
          >          
          <Sider
            width={220}
            style={{
              background: colorBgContainer,
              overflow: 'auto',
              alignSelf: 'stretch',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '12px 12px 14px',
                  borderBottom: `1px solid ${colorSplit}`,
                  flexShrink: 0,
                }}
              >
                <img
                  src={resolveAdminSidebarProfileSrc(
                    import.meta.env.VITE_SPRING_IP,
                  )}
                  alt="관리자 프로필"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: colorText,
                      lineHeight: 1.35,
                    }}
                  >
                    PLAN A 관리자 페이지
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: colorText,
                      marginTop: 4,
                      lineHeight: 1.35,
                    }}
                  >
                    {profileName ? `${profileName}님` : '관리자님'}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: colorTextSecondary,
                      marginTop: 4,
                      wordBreak: 'break-all',
                    }}
                  >
                    {profileEmail || '—'}
                  </div>
                </div>
              </div>
              <Menu
                mode="inline"
                selectedKeys={selectedKeys}
                onClick={({ key: menuKey }) => {
                  if (menuKey === '2') {
                    setMemberRegisterModalOpen(true)
                    return
                  }
                  setSelectedKeys([menuKey])
                }}
                defaultOpenKeys={['sub1', 'sub2', 'sub3']}
                style={{ flex: 1, borderInlineEnd: 0, overflow: 'auto' }}
                items={items2}
              />
            </div>
          </Sider>
          </ConfigProvider>
          <Layout
            style={{
              padding: '0 24px 24px',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Breadcrumb
              items={[
                { title: 'Admin' },
                { title: currentParentTitle },
                { title: currentPageTitle },
              ]}
              style={{ margin: '16px 0' }}
            />
            <Content
              style={{
                padding: 24,
                margin: 0,
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <div key={key}>
                {key === '1' ? (
                  <MemberList />
                ) : (
                  <>
                    <h2
                      style={{
                        marginTop: 0,
                        marginBottom: 12,
                        fontSize: 20,
                        fontWeight: 600,
                        color: colorText,
                      }}
                    >
                      {currentPageTitle}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: colorTextSecondary,
                      }}
                    >
                      {currentContentDescription}
                    </p>
                  </>
                )}
              </div>
            </Content>

            <SignUp
              memberRegisterModalOpen={memberRegisterModalOpen}
              closeMemberRegisterModal={closeMemberRegisterModal}
              memberForm={memberForm}
              profileImageFileList={profileImageFileList}
              memberRegisterSubmitting={memberRegisterSubmitting}
              setMemberRegisterSubmitting={setMemberRegisterSubmitting}
            />

          </Layout>
        </Layout>

      </Layout>
    </div>
  )
}

export default AdminPage
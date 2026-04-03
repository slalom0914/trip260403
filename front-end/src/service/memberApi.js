import axiosInstance from './axiosInstance';

/**
 * 회원 등록. JSON 객체 또는 FormData(multipart, 프로필 이미지 포함) 전달 가능.
 * @param {Record<string, unknown>|FormData} payload
 */
/** @param {string} nickname */
export const existsNicknameApi = async (nickname) => {
  const response = await axiosInstance.get('/api/member/existsNickname', {
    params: { nickname },
  });
  return response.data;
};

export const memberInsertApi = async (payload) => {
  console.log(payload)

  const response = await axiosInstance.post(
    '/api/member/memberInsert',
    payload,
    payload instanceof FormData
      ? undefined
      : { headers: { 'Content-Type': 'application/json' } },
  );
  return response.data;

  //return 1;
};

export const getMyInfoApi = async () => {
  const response = await axiosInstance.get('/api/members/me');
  return response.data;
};

/** @param {Record<string, string|undefined>} [params] */
export const getAllMembersApi = async (params = {}) => {
  const response = await axiosInstance.get('/api/admin/getAllMembers', { params });
  return response.data;
};

/**
 * @param {string|number} memberId
 * @param {'ROLE_MEMBER'|'ROLE_MANAGER'|'ROLE_ADMIN'} role
 */
export const updateRoleApi = async (memberId, role) => {
  const response = await axiosInstance.patch(
    `/api/admin/members/${memberId}/role`,
    { role }
  );
  return response.data;
};

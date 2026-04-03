/**
 * Access JWT의 payload에서 subject(sub) 값을 추출하는 함수
 *
 * 사용 목적:
 * - 프론트 화면에 회원 ID 표시
 * - localStorage/sessionStorage에 간단한 사용자 식별값 저장
 * - 앱 초기 진입 시 토큰 기반 사용자 식별
 *
 * 주의:
 * - JWT의 payload만 디코딩할 뿐, 서명(signature) 검증은 하지 않음
 * - 따라서 "보안 검증" 용도가 아니라 "표시/편의 기능" 용도로만 사용해야 함
 *
 * 백엔드 예시:
 * - Spring Boot / NestJS 등에서 JWT 발급 시 subject(sub)에 member_id 저장
 * 
 * 이 함수의 역할:
 * - 브라우저에 저장된 Access Token에서 JWT의 payload부분을 디코딩해서 payload.sub 값을 읽어
 * 회원 식별값(member_id)으로 사용하는 것. 
 * 이 함수가 하는 일(실행 흐름) :
 * 1. 토큰 존재 여부 확인
 * - null, undefined, 빈값, 문자열이 아닌 값이면 null 반환
 * 2. JWT형식 분리
 * - JWT는 보통 header.payload.signature 구조임. 
 * - split('.')해서 두 번째 조각인 payload 추출
 * 3. Base64URL -> Base64 변환
 * - JWT payload는 보통 Base64URL형식
 * - atob()로 디코딩하려면 -, _를 일반 Base64문자로 바꿔야 함. 
 * 4. padding보정
 * - Base64길이가 4의 배수가 아니면 = 추가
 * 5. payload JSON 파싱
 * - 디코딩한 문자열을 JSON.parse() 해서 객체로 변환
 * 6. sub 추출
 * - payload.sub 읽기
 * - 값이 있으면 문자열로 변환해서 반환
 * 7. 실패시 null 반환
 * - 토큰이 깨졌거나 JSON파싱 실패하면 null  
 * 
 *Spring Boot와 JWT 인증 구조에서 진짜 인증과 인가는 서버가 해야 합니다.
 * 실무 기준으로는:
 * 1. 프론트는 Access Token을 요청 헤더에 실어 보냄
 * 2. Spring Boot가 토큰 검증
 * 3. 서버가 sub, email, role 등을 확인
 * 4. 서버가 응답 데이터 반환
 * 
 * 따라서 로그인 사용자인지, 누구인지, 권한이 뭔지는 서버가 판단해야 합니다.
 * 
 * 즉 아래는 서버 책임입니다.
 * 1. 토큰이 유효한지
 * 2. 만료되었는지
 * 3. 블랙리스트인지
 * 4. 실제 회원인지
 * 5. role이 맞는지
 * 
 * 프론트에서 sub를 꺼내는 건 어디까지나 보조 정보 확인 수준입니다.
 * 
 * 
 * 
 * 
 * @param {string | null | undefined} accessToken - JWT Access Token
 * @returns {string | null} - payload.sub 값(member_id) 또는 실패 시 null
 */
export function getMemberIdFromAccessToken(accessToken) {
  // 1) 토큰이 없거나 문자열이 아니면 처리 불가
  if (!accessToken || typeof accessToken !== 'string') return null;

  try {
    // 2) JWT는 일반적으로 "header.payload.signature" 구조
    //    split('.') 후 두 번째 요소가 payload
    const part = accessToken.split('.')[1];

    // payload가 없으면 잘못된 JWT 형식이므로 null 반환
    if (!part) return null;

    // 3) JWT payload는 Base64URL 형식일 수 있음
    //    atob()는 일반 Base64 형식을 기대하므로 문자 치환 필요
    //    - -> +
    //    _ -> /
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');

    // 4) Base64 문자열 길이는 4의 배수여야 함
    //    부족한 길이만큼 '=' padding 추가
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';

    // 5) Base64 디코딩 후 JSON 문자열을 객체로 변환
    const payload = JSON.parse(atob(b64 + pad));

    // 6) JWT 표준 claim 중 subject(sub) 추출
    //    현재 프로젝트에서는 sub에 member_id가 들어있다고 가정
    const sub = payload.sub;

    // 7) sub가 null/undefined/빈문자열이 아니면 문자열로 변환하여 반환
    //    숫자형으로 들어와도 String() 처리로 안전하게 문자열 통일
    return sub != null && sub !== '' ? String(sub) : null;
  } catch {
    // 8) 디코딩 실패, JSON 파싱 실패 등 예외 발생 시 null 반환
    return null;
  }
}

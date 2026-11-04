import { apiFetch, toApiError } from "./client";

// 2.1.1 로그인
// 응답: { access_token, token_type: "Bearer", user_id, name, email }
export async function login(email, password, autoLogin = false) {
  const response = await apiFetch(`/auth/login`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body:
    JSON.stringify({
        email,
        password,
        auto_login: autoLogin
    })
  });

  // 400 INVALID_CREDENTIALS: 이메일 또는 비밀번호 불일치
  if (response.status === 400) {
    throw await toApiError(
      response,
      "이메일 또는 비밀번호가 올바르지 않습니다. 입력한 정보를 다시 확인해 주세요."
    );
  }

  // 429 TOO_MANY_REQUESTS: 로그인 시도 횟수 초과
  if (response.status === 429) {
    throw await toApiError(
      response,
      "로그인 시도 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  if (!response.ok) {
    throw await toApiError(response, "로그인 처리 중 문제가 발생했습니다.");
  }
  return await response.json();
}

// 2.1.3 회원가입
// 비밀번호는 8자 이상. 이메일 중복 시 오류 코드는 명세에 아직 없어서 409로 가정한다
export async function signup(email, password, name) {
  const response = await apiFetch(`/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      name
    })
  });

  // 409: 이미 같은 이메일로 가입된 계정이 있음
  if (response.status === 409) {
    throw await toApiError(response, "이미 가입된 이메일입니다.");
  }

  if (!response.ok) {
    throw await toApiError(response, "회원가입 처리 중 문제가 발생했습니다.");
  }

  // 201 Created는 본문 없이 올 수 있어서, 본문이 비어 있으면 json()을 호출하지 않는다
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// 2.1.2 로그아웃: 현재 세션 토큰 무효화
export async function logout() {
  return await apiFetch(`/auth/logout`, {
    method: "POST"
  });
}


/* ===== 추가 예정 API — 서버 연결 후 주석 해제 ===== */

/* 2.1.4 아이디 찾기 (본인 인증 후 가입 이메일 조회)
   응답: { email }  마스킹 처리된 형식

export async function findId(name, phoneNumber, verificationCode) {
  const response = await apiFetch(`/auth/find-id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      phone_number: phoneNumber,
      verification_code: verificationCode
    })
  });

  if (!response.ok) {
    throw await toApiError(response, "아이디 찾기에 실패했습니다.");
  }

  return response.json();
}
*/


/* 2.1.5 비밀번호 재설정 (본인 인증 후 새 비밀번호 설정, 8자 이상)
   응답: { message }

export async function resetPassword(email, verificationCode, newPassword) {
  const response = await apiFetch(`/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      verification_code: verificationCode,
      new_password: newPassword
    })
  });

  // 400 INVALID_VERIFICATION_CODE: 인증 코드가 유효하지 않거나 만료됨
  if (response.status === 400) {
    throw await toApiError(response, "인증 코드가 유효하지 않거나 만료되었습니다.");
  }

  // 404 USER_NOT_FOUND: 등록되지 않은 이메일
  if (response.status === 404) {
    throw await toApiError(response, "등록되지 않은 이메일입니다.");
  }

  if (!response.ok) {
    throw await toApiError(response, "비밀번호 재설정에 실패했습니다.");
  }

  return response.json();
}
*/


/* 2.1.6.1 로그인 기기 목록 조회
   응답: [{ session_id, client_name, ip_address, last_active_at, is_current }]

export async function getSessions() {
  const response = await apiFetch(`/auth/sessions`);

  if (!response.ok) {
    throw await toApiError(response, "로그인 기기 목록 조회에 실패했습니다.");
  }

  return response.json();
}
*/


/* 2.1.6.2 단일 기기 강제 로그아웃
   응답: { message }

export async function revokeSession(sessionId) {
  const response = await apiFetch(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE"
  });

  // 404 SESSION_NOT_FOUND: 존재하지 않거나 이미 만료된 세션
  if (response.status === 404) {
    throw await toApiError(response, "이미 로그아웃된 기기입니다.");
  }

  if (!response.ok) {
    throw await toApiError(response, "기기 로그아웃에 실패했습니다.");
  }

  return response.json();
}
*/


/* 2.1.6.3 현재 기기를 제외한 다른 모든 기기 일괄 로그아웃
   응답: { revoked_count }

export async function revokeOtherSessions() {
  const response = await apiFetch(`/auth/sessions/other`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw await toApiError(response, "다른 기기 로그아웃에 실패했습니다.");
  }

  return response.json();
}
*/


/* 2.1.7 회원 탈퇴
   응답: { message }

export async function deleteAccount(password, reason) {
  const response = await apiFetch(`/auth/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password, reason })
  });

  // 400 INVALID_PASSWORD: 비밀번호 불일치
  if (response.status === 400) {
    throw await toApiError(response, "비밀번호가 올바르지 않습니다.");
  }

  if (!response.ok) {
    throw await toApiError(response, "회원 탈퇴 처리에 실패했습니다.");
  }

  return response.json();
}
*/

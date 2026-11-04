// 로그인 상태 유지(remember me) 저장소.
// 체크하고 로그인하면 토큰을 localStorage에 남겨 브라우저를 다시 열어도 자동 로그인하고,
// 체크하지 않으면 sessionStorage에만 둬서 브라우저를 닫으면 로그아웃된다.

const KEY_TOKEN = "accessToken";
const KEY_REFRESH_TOKEN = "refreshToken";
const KEY_REMEMBER_ME = "rememberMe";
const KEY_EMAIL = "rememberedEmail";
const KEY_LOGIN_NOTICE = "loginNotice";

export function getAccessToken() {
  return (
    localStorage.getItem(KEY_TOKEN) ||
    sessionStorage.getItem(KEY_TOKEN)
  );
}

export function isRememberMe() {
  return localStorage.getItem(KEY_REMEMBER_ME) === "true";
}

export function getRememberedEmail() {
  return localStorage.getItem(KEY_EMAIL) || "";
}

// 로그인 상태 유지가 켜져 있고 토큰이 남아 있으면 로그인 화면을 건너뛴다
export function hasSavedSession() {
  return isRememberMe() && !!localStorage.getItem(KEY_TOKEN);
}

export function saveSession(email, token, rememberMe) {
  clearSession();

  if (rememberMe) {
    localStorage.setItem(KEY_REMEMBER_ME, "true");
    localStorage.setItem(KEY_EMAIL, email);
    localStorage.setItem(KEY_TOKEN, token);
    return;
  }

  // 체크를 해제하고 로그인하면 저장된 이메일·체크 상태도 지운다
  localStorage.removeItem(KEY_REMEMBER_ME);
  localStorage.removeItem(KEY_EMAIL);
  sessionStorage.setItem(KEY_TOKEN, token);
}

// 로그아웃: 토큰만 지우고 이메일·체크 상태는 남겨 로그인 화면에 채워 준다
export function clearSession() {
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(KEY_TOKEN);
    storage.removeItem(KEY_REFRESH_TOKEN);
  });
}

// 401로 로그인 화면에 보낼 때 띄울 문구. 로그인 화면이 한 번 꺼내 보여 주고 지운다
export function saveLoginNotice(message) {
  sessionStorage.setItem(KEY_LOGIN_NOTICE, message);
}

export function takeLoginNotice() {
  const message = sessionStorage.getItem(KEY_LOGIN_NOTICE);
  sessionStorage.removeItem(KEY_LOGIN_NOTICE);
  return message;
}

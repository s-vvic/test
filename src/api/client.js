// 모든 API 요청이 거쳐 가는 fetch 래퍼
// - 베이스 URL을 붙이고, 로그인한 상태면 Authorization: Bearer {access_token} 헤더를 넣는다
// - 401이면 토큰을 지우고 로그인 화면으로 보낸다
// - 서버 오류 응답 { error_code, message, details }는 ApiError로 바꿔 message를 화면에 띄운다
// - 서버에 아예 닿지 못하면(네트워크 오류) NetworkError를 던지고 "VPN 연결을 확인하세요" 안내를 띄운다

import { API_BASE_URL } from "./config";
import {
  getAccessToken,
  clearSession,
  saveLoginNotice
} from "../storage/authStorage";

// MainLayout의 오류 토스트가 이 이벤트를 듣고 message를 보여 준다
export const API_ERROR_EVENT = "api-error";

// VpnContext가 이 이벤트를 듣고 VPN 안내 배너를 띄운다
export const VPN_UNREACHABLE_EVENT = "vpn-unreachable";

const SESSION_EXPIRED_MESSAGE = "로그인이 만료되었습니다. 다시 로그인해 주세요.";
export const VPN_CHECK_MESSAGE = "VPN 연결을 확인하세요.";

export class ApiError extends Error {
  constructor(status, { error_code, message, details } = {}, fallbackMessage) {
    super(message || fallbackMessage);
    this.name = "ApiError";
    this.status = status;
    this.code = error_code ?? null;
    this.details = details ?? null;
  }
}

// 서버에 닿지 못함. API 서버(10.0.0.1)는 VPN 안에만 있어서 대부분 VPN이 끊긴 경우다
// (서버가 꺼져 있거나 CORS로 막혀도 브라우저는 똑같이 네트워크 오류로 알려 준다)
export class NetworkError extends ApiError {
  constructor(cause) {
    super(0, { error_code: "NETWORK_ERROR" }, VPN_CHECK_MESSAGE);
    this.name = "NetworkError";
    this.cause = cause;
  }
}

// 오류 응답 본문을 읽는다. 본문이 없거나 JSON이 아니면 빈 객체
async function readErrorBody(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function apiFetch(path, { headers, ...options } = {}) {
  const token = getAccessToken();

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers
      }
    });
  } catch (cause) {
    // 요청을 직접 취소한 경우는 네트워크 오류가 아니다
    if (cause?.name === "AbortError") {
      throw cause;
    }

    window.dispatchEvent(new CustomEvent(VPN_UNREACHABLE_EVENT));
    throw new NetworkError(cause);
  }

  // 로그인한 상태에서 401: 토큰이 만료되었거나 유효하지 않음
  if (response.status === 401 && token) {
    const error = new ApiError(401, await readErrorBody(response), SESSION_EXPIRED_MESSAGE);

    clearSession();
    saveLoginNotice(error.message);
    window.location.replace("/login");

    throw error;
  }

  return response;
}

// 실패한 응답을 ApiError로 바꾼다. 서버 message가 없으면 fallbackMessage를 쓴다
// notify: false면 오류 토스트를 띄우지 않는다 (5초 주기 자동 재조회처럼 같은 오류가 반복되는 요청용)
export async function toApiError(response, fallbackMessage, { notify = true } = {}) {
  const error = new ApiError(response.status, await readErrorBody(response), fallbackMessage);

  if (notify) {
    window.dispatchEvent(new CustomEvent(API_ERROR_EVENT, { detail: error }));
  }

  return error;
}

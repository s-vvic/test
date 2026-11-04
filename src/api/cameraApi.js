import { apiFetch, toApiError } from "./client";
import { normalizeMac, deviceIdFromMac } from "../utils/mac";

/* ===== 보드 관리 (ICD 2.2) — 보드는 MAC 주소로 구분한다 ===== */

// 화면은 ICD 2.2.1 응답 필드명(snake_case)을 그대로 쓴다 (목업 data/cameras.js도 같은 모양)
// 여기서는 빠진 값만 채운다
function toCamera(item) {
  return {
    // device_id (I1 예외: "CAM-" + MAC 끝 4자리). 응답에 없으면 같은 규칙으로 만든다
    device_id: item.device_id ?? deviceIdFromMac(item.mac),
    mac: normalizeMac(item.mac),  // 대문자, 콜론 없는 12자리
    name: item.name ?? "",
    location: item.location ?? "",
    status: item.status ?? "offline",  // online / offline (last_seen 후 15초 초과 시 offline)
    last_seen: item.last_seen ?? null,
    firmware_version: item.firmware_version ?? null,
    vpn_status: item.vpn_status ?? null,
    vpn_ip: item.vpn_ip ?? null,
    latest_event_time: item.latest_event_time ?? null,
    thumbnail_url: item.thumbnail_url ?? null
  };
}

// 2.2.2 보드 등록
// cameraData: { mac, name, location }  name은 비워 두면 서버가 자동 부여
// mac은 서버 형식(대문자, 콜론 없는 12자리)으로 바꿔서 보낸다
export async function registerCamera({ mac, name, location }) {
  const response = await apiFetch(`/devices/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mac: normalizeMac(mac),
      ...(name && { name }),
      location
    }),
  });

  if (!response.ok) {
    throw await toApiError(response, "카메라 등록에 실패했습니다.");
  }

  // 등록 응답 형식이 명세에 없어서, 본문이 비어 있으면 null을 돌려준다
  const text = await response.text();
  return text ? toCamera(JSON.parse(text)) : null;
}

// 2.2.1 보드 목록 조회
// VPN이 끊겨 있으면 10.0.0.1로 가는 요청이 응답 없이 오래 걸려서, 5초가 지나면 끊는다
// (시간 초과는 TimeoutError라 apiFetch에서 NetworkError → "VPN 연결을 확인하세요"로 처리된다)
const LIST_TIMEOUT_MS = 5000;

// silent: true면 실패해도 오류 토스트를 띄우지 않는다 (자동 재조회용)
export async function getCameras({ silent = false } = {}) {
  const response = await apiFetch(`/devices`, {
    signal: AbortSignal.timeout(LIST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw await toApiError(response, "카메라 목록 조회에 실패했습니다.", { notify: !silent });
  }

  const data = await response.json();

  // 명세는 배열이지만, { devices: [...] } 처럼 감싸서 와도 읽을 수 있게 한다
  const list = Array.isArray(data) ? data : data?.devices ?? data?.items ?? [];

  return list.map(toCamera);
}

/* ===== 추가 예정 API — 서버 연결 후 주석 해제 ===== */

/* 2.2.3 보드 상태 조회
   응답: { status, vpn_status, vpn_ip, last_handshake, uptime_seconds,
           storage_total_gb, storage_used_gb, rtsp_url [TBD], rtsp_url_sub [TBD] }

export async function getCameraStatus(mac) {
  const response = await apiFetch(`/devices/${encodeURIComponent(mac)}/status`);

  if (!response.ok) {
    throw await toApiError(response, "카메라 상태 조회에 실패했습니다.");
  }

  return response.json();
}
*/


/* 2.2.4 보드 정보 수정 (WEB-F-023 카메라 이름 수정 포함)
   (Monitoring.jsx / DeviceManage.jsx 주석에서 호출하는 함수)
   changes: { name (최대 50자), location, description (최대 200자) } 중 바꿀 항목만

export async function updateCamera(mac, changes) {
  const response = await apiFetch(`/devices/${encodeURIComponent(mac)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });

  if (!response.ok) {
    throw await toApiError(response, "카메라 정보 수정에 실패했습니다.");
  }
}

export async function updateCameraName(mac, name) {
  return updateCamera(mac, { name });
}
*/


/* WEB-F-012 멀티뷰 저해상도 스트림 요청 [명세 없음]
   저화질 스트림 주소는 2.2.3 보드 상태 조회의 rtsp_url_sub [TBD]로 받을 예정
   요청: 선택 카메라 ID 목록
   응답: [{ cameraId, streamUrl, sessionId }]

export async function getLowResStreams(cameraIds) {
  const response = await apiFetch(`/streams/low-res`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cameraIds }),
  });

  if (!response.ok) {
    throw await toApiError(response, "저해상도 스트림 요청에 실패했습니다.");
  }

  return response.json();
}
*/

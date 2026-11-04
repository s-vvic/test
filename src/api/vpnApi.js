import { apiFetch, toApiError } from "./client";
import { VPN_CLIENT_SUBNET, isInSubnet } from "./config";
import { formatDateTime } from "../utils/formatDateTime";

// 클라이언트 VPN 연결 여부 확인 [명세 없음]
// 서버는 요청의 출발지 IP가 클라이언트 대역(10.0.2.0/24)인지 보고 { connected, client_ip }로 응답한다
// 서버에 닿지 못하면 apiFetch가 NetworkError를 던지고, VpnContext가 이를 연결 실패로 처리한다
export async function fetchClientVpnStatus() {

  /*
  서버 없이 화면을 확인할 때만 VPN 연결 성공으로 우회한다. (지금은 비활성화)
  return true;
  */

  const response = await apiFetch(`/status`);

  if (!response.ok) {
    throw await toApiError(response, "VPN 상태 확인 실패");
  }

  const data = await response.json();

  // 서버가 알려 준 주소가 클라이언트 대역이 아니면 VPN을 거치지 않은 요청이다
  if (data.client_ip && !isInSubnet(data.client_ip, VPN_CLIENT_SUBNET)) {
    return false;
  }

  return data.connected === true;
}

// 2.8.1 클라이언트 VPN 등록 [TBD]
// 클라이언트 기기에서 만든 WireGuard 공개키만 보낸다 (개인키는 기기 밖으로 보내지 않는다)
// 응답: { vpn_ip, server_pubkey, server_endpoint, allowed_ips }
export async function registerClientVpn(wgPubkey, clientName) {
  const response = await apiFetch(`/vpn/clients/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      wg_pubkey: wgPubkey,
      client_name: clientName
    })
  });

  // 409 PUBKEY_ALREADY_REGISTERED: 이미 등록된 공개키
  if (response.status === 409) {
    throw await toApiError(response, "이미 등록된 기기입니다.");
  }

  if (!response.ok) {
    throw await toApiError(response, "클라이언트 VPN 등록 실패");
  }

  return response.json();
}

/* ===== 카메라 보드 VPN 관리 (ICD 2.5) — 기기는 MAC 주소로 구분한다 ===== */

// 연결 지속 시간(초)을 "3일 12시간 24분" 형태로 바꾼다
function formatDuration(totalSec) {
  if (!totalSec) {
    return "-";
  }

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  return [
    days && `${days}일`,
    hours && `${hours}시간`,
    `${minutes}분`
  ].filter(Boolean).join(" ");
}

// 서버 응답(snake_case)을 VPN 화면에서 쓰는 기기 모양으로 바꾼다
function toVpnDevice(item) {
  return {
    id: item.mac,
    mac: item.mac,
    name: item.device_name,
    serial: "",  // 응답에 시리얼 번호가 없어 "-"로 표시된다
    vpnStatus: item.vpn_status,
    vpnIp: item.vpn_ip || "-",
    server: item.vpn_server || "-",
    duration: formatDuration(item.connected_duration_sec),
    // UTC(ISO 8601) → KST "YYYY-MM-DD HH:mm" (목업과 같은 형태)
    lastHandshake: item.last_handshake ? formatDateTime(item.last_handshake).slice(0, 16) : "-",
    error: item.error_type ?? null,
    autoConnect: item.auto_connect,
    startAutoConnect: item.reconnect_on_start,
    reconnectOnNetworkChange: item.reconnect_on_network_change
  };
}

// VPN이 끊겨 있으면 응답 없이 오래 걸려서 5초가 지나면 끊는다 (cameraApi getCameras와 동일)
const LIST_TIMEOUT_MS = 5000;

// 2.5.1 VPN 연결 상태 목록 조회
// silent: true면 실패해도 오류 토스트를 띄우지 않는다 (자동 재조회용)
export async function getVpnDevices({ silent = false } = {}) {
  const response = await apiFetch(`/vpn/connections`, {
    signal: AbortSignal.timeout(LIST_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw await toApiError(response, "VPN 장치 목록 조회 실패", { notify: !silent });
  }

  const data = await response.json();

  // 명세는 배열이지만, { connections: [...] } 처럼 감싸서 와도 읽을 수 있게 한다
  const list = Array.isArray(data) ? data : data?.connections ?? data?.items ?? [];

  return list.map(toVpnDevice);
}

// 2.5.2 VPN 수동 연결 / 끊기 [TBR]
// 서버가 해당 보드의 peer를 재등록(connect)하거나 제거(disconnect)한다
// action: "connect" | "disconnect"
export async function changeVpnConnection(mac, action) {
  const response = await apiFetch(
    `/vpn/connections/${encodeURIComponent(mac)}/action`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action })
    }
  );

  if (!response.ok) {
    throw await toApiError(
      response,
      action === "connect" ? "VPN 연결 요청 실패" : "VPN 끊기 요청 실패"
    );
  }
}

// 2.5.3 VPN 서버 복구 요청
// Device VPN 오류 시 서버 측 터널 재설정 및 복구
export async function requestVpnRecovery(mac) {
  const response = await apiFetch(
    `/vpn/connections/${encodeURIComponent(mac)}/recover`,
    {
      method: "POST"
    }
  );

  if (!response.ok) {
    throw await toApiError(response, "VPN 복구 요청 실패");
  }
}


/* ===== 추가 예정 API — 서버 연결 후 주석 해제 ===== */

/* WEB-F-051 Device VPN 상태 요약 [명세 없음]
   2.5.1 목록(getVpnDevices)의 vpnStatus를 세어서 대신할 수 있다
   응답: { connected, disconnected, error }

export async function getVpnSummary() {
  const response = await apiFetch(`/vpn/devices/summary`);

  if (!response.ok) {
    throw await toApiError(response, "VPN 상태 요약 조회 실패");
  }

  return response.json();
}
*/


/* WEB-F-054 Device VPN 상세 정보 [명세 없음]
   상태 정보는 2.2.3 보드 상태 조회(cameraApi getCameraStatus)로 받을 수 있다
   응답: { deviceId, lastHandshake, vpnIp, connectedDuration, server,
           error: { code, message, occurredAt } | null, history: [{ at, status, message }] }

export async function getVpnDeviceDetail(deviceId) {
  const response = await apiFetch(`/vpn/devices/${deviceId}`);

  if (!response.ok) {
    throw await toApiError(response, "VPN 상세 정보 조회 실패");
  }

  return response.json();
}
*/

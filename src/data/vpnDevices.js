// VPN 연결 관리 화면 목업 (서버 연결 전 시연용)
// 대시보드 · 통계 · 멀티뷰와 같은 Device VPN 목록(getDeviceVpnList)에서 만들어서
// 기기 수와 연결 상태(정상 / 연결 끊김 / 오류)가 모든 화면에서 같도록 함

import { cameras } from "./cameras";
import { getDeviceVpnList } from "./statisticsMock";
import { VPN_SERVER_IP, VPN_PORT } from "../api/config";
import { formatDateTime } from "../utils/formatDateTime";

// 보드가 붙는 WireGuard 서버 (ICD 5.1)
const VPN_SERVER = `${VPN_SERVER_IP}:${VPN_PORT}`;

// VPN 연결 유지 시간 (보드 목록 응답에는 없는 값이라 VPN 화면 목업에만 둔다)
const CONNECTED_DURATION = {
  "CAM-0001": "3일 12시간 24분", "CAM-0003": "5일 7시간 11분", "CAM-0004": "2일 18시간 43분",
  "CAM-0006": "7일 3시간 52분", "CAM-0007": "4일 22시간 16분", "CAM-0009": "11일 5시간 33분",
  "CAM-000A": "8일 16시간 21분", "CAM-000C": "21일 8시간 42분", "CAM-000D": "6일 11시간 07분",
  "CAM-000F": "1일 13시간 55분", "CAM-0010": "9일 4시간 18분", "CAM-0012": "4일 1시간 45분",
  "CAM-0013": "4일 1시간 43분", "CAM-0015": "12일 9시간 26분", "CAM-0016": "10일 17시간 08분",
};

// 기기별 자동 연결 설정 (지정하지 않은 기기는 모두 켜짐)
const AUTO_CONNECT_OVERRIDES = {
  "CAM-0003": { startAutoConnect: false },
  "CAM-0004": { reconnectOnNetworkChange: false },
};

export const initialVpnDevices = getDeviceVpnList().map((device) => {
  const camera = cameras.find((item) => item.device_id === device.cameraId) ?? {};
  const isConnected = device.vpnStatus === "connected";

  return {
    id: device.cameraId,
    name: device.cameraName,
    serial: "",  // 보드 목록 응답(ICD 2.2.1)에 시리얼 번호가 없어 "-"로 표시된다 (vpnApi와 동일)
    vpnStatus: device.vpnStatus,
    duration: isConnected ? CONNECTED_DURATION[device.cameraId] ?? "-" : "-",
    server: VPN_SERVER,
    vpnIp: isConnected ? camera.vpn_ip ?? "-" : "-",
    // 시연용 재연결 때 다시 붙일 주소 (보드 목록의 vpn_ip)
    assignedIp: camera.vpn_ip ?? "-",
    // 오류 기기는 마지막으로 성공한 Handshake 시간을 남김
    lastHandshake:
      device.vpnStatus === "disconnected"
        ? "-"
        : camera.last_seen ? formatDateTime(camera.last_seen).slice(0, 16) : "-",
    error: device.error,
    autoConnect: true,
    startAutoConnect: true,
    reconnectOnNetworkChange: true,
    ...AUTO_CONNECT_OVERRIDES[device.cameraId],
  };
});

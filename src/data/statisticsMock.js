// 대시보드 / 통계 화면용 목업 데이터 생성기
// 서버 연결 전 시연용 — 같은 조건이면 항상 같은 값이 나오도록 시드 기반 난수 사용

import { cameras } from "./cameras";

const EVENT_TYPES = [
  "motion",
  "sound",
  "camera_connect",
  "camera_disconnect",
  "vpn_connect",
  "vpn_disconnect",
];

// 유형별 발생 비중 (움직임/소리가 대부분)
const TYPE_WEIGHTS = {
  motion: 0.42,
  sound: 0.24,
  camera_connect: 0.1,
  camera_disconnect: 0.09,
  vpn_connect: 0.08,
  vpn_disconnect: 0.07,
};

function hashString(text) {
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seedText) {
  let seed = hashString(seedText);

  return function random() {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function eachDay(startDate, endDate) {
  const days = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end && days.length < 366) {
    days.push(toDateInputValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

// 카메라 1대, 하루 이벤트 수
function dailyCount(cameraId, day) {
  const random = seededRandom(`${cameraId}-${day}`);
  const camera = cameras.find((c) => c.device_id === cameraId);

  // 오프라인 카메라는 이벤트가 적게
  const base = camera?.status === "online" ? 9 : 3;

  return Math.round(base * (0.4 + random() * 1.2));
}

/*
  통계 데이터 생성 (WEB-F-040, WEB-F-042)
  서버 응답 형태를 가정:
  {
    trend:   [{ date, count }],
    byType:  [{ type, count }],
    byCamera:[{ cameraId, cameraName, location, count }],
    byHour:  [{ hour, count }],
    total
  }
*/
export function generateStatistics({ startDate, endDate, cameraId = "all" }) {
  const days = eachDay(startDate, endDate);

  const targetCameras =
    cameraId === "all"
      ? cameras
      : cameras.filter((c) => String(c.device_id) === String(cameraId));

  const trend = days.map((day) => ({
    date: day,
    count: targetCameras.reduce(
      (sum, camera) => sum + dailyCount(camera.device_id, day),
      0
    ),
  }));

  const byCamera = targetCameras
    .map((camera) => ({
      cameraId: camera.device_id,
      cameraName: camera.name,
      location: camera.location,
      count: days.reduce((sum, day) => sum + dailyCount(camera.device_id, day), 0),
    }))
    .sort((a, b) => b.count - a.count);

  const total = trend.reduce((sum, item) => sum + item.count, 0);

  // 유형별 분배
  const typeRandom = seededRandom(`type-${startDate}-${endDate}-${cameraId}`);
  let remain = total;

  const byType = EVENT_TYPES.map((type, index) => {
    if (index === EVENT_TYPES.length - 1) {
      return { type, count: Math.max(0, remain) };
    }

    const jitter = 0.85 + typeRandom() * 0.3;
    const count = Math.min(remain, Math.round(total * TYPE_WEIGHTS[type] * jitter));

    remain -= count;

    return { type, count };
  });

  // 시간대별 분배 (저녁/야간에 많이 발생하는 형태)
  const hourRandom = seededRandom(`hour-${startDate}-${endDate}-${cameraId}`);

  const hourWeights = Array.from({ length: 24 }, (_, hour) => {
    const evening = Math.exp(-((hour - 20) ** 2) / 18);
    const morning = 0.6 * Math.exp(-((hour - 8) ** 2) / 8);
    return 0.15 + evening + morning + hourRandom() * 0.15;
  });

  const weightSum = hourWeights.reduce((a, b) => a + b, 0);

  const byHour = hourWeights.map((weight, hour) => ({
    hour,
    count: Math.round((total * weight) / weightSum),
  }));

  return { trend, byType, byCamera, byHour, total };
}

/*
  대시보드 요약 (WEB-F-001)
  { totalCameras, onlineCameras, offlineCameras, todayEvents, unreadAlerts }
*/
export function generateDashboardSummary(unreadAlerts) {
  const today = toDateInputValue(new Date());

  const todayEvents = cameras.reduce(
    (sum, camera) => sum + dailyCount(camera.device_id, today),
    0
  );

  const onlineCameras = cameras.filter((c) => c.status === "online").length;

  return {
    totalCameras: cameras.length,
    onlineCameras,
    offlineCameras: cameras.length - onlineCameras,
    todayEvents,
    unreadAlerts,
  };
}

/*
  카메라 / Device VPN 상태 요약 (WEB-F-041)
  cameras.js(ICD 2.2.1 목업)에는 오류 상태가 없어서 시연용으로 일부 기기를 오류로 표시
*/
const DEMO_VPN_ERROR_IDS = ["CAM-0004", "CAM-0011"];

export function getDeviceVpnList() {
  return cameras.map((camera) => {
    const isError = DEMO_VPN_ERROR_IDS.includes(camera.device_id);

    return {
      cameraId: camera.device_id,
      cameraName: camera.name,
      location: camera.location,
      vpnStatus: isError ? "error" : camera.vpn_status,
      error: isError ? "Handshake Timeout" : null,
    };
  });
}

export function generateStatusSummary() {
  const vpnList = getDeviceVpnList();

  const onlineCameras = cameras.filter((c) => c.status === "online").length;

  return {
    totalCameras: cameras.length,
    onlineCameras,
    offlineCameras: cameras.length - onlineCameras,
    vpnConnected: vpnList.filter((d) => d.vpnStatus === "connected").length,
    vpnDisconnected: vpnList.filter((d) => d.vpnStatus === "disconnected").length,
    vpnError: vpnList.filter((d) => d.vpnStatus === "error").length,
  };
}

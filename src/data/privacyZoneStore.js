// 프라이버시 존 목업 저장소 (서버 연결 전 시연용)
// 좌표는 영상 크기 대비 비율(0~1)로 저장 → 해상도와 무관하게 적용
// zone: { id, name, x, y, width, height, enabled }

// 키: device_id
const zonesByCamera = {
  "CAM-0001": [
    { id: "zone-1-1", name: "현관 도어락", x: 0.62, y: 0.28, width: 0.16, height: 0.22, enabled: true },
  ],
  "CAM-0003": [
    { id: "zone-3-1", name: "창문", x: 0.08, y: 0.12, width: 0.3, height: 0.35, enabled: true },
    { id: "zone-3-2", name: "TV 화면", x: 0.55, y: 0.4, width: 0.25, height: 0.2, enabled: false },
  ],
  "CAM-000C": [
    { id: "zone-12-1", name: "모니터", x: 0.4, y: 0.3, width: 0.22, height: 0.18, enabled: true },
  ],
};

export function getZones(cameraId) {
  return (zonesByCamera[cameraId] ?? []).map((zone) => ({ ...zone }));
}

export function saveZones(cameraId, zones) {
  zonesByCamera[cameraId] = zones.map((zone) => ({ ...zone }));

  return getZones(cameraId);
}

export function countZones(cameraId) {
  return (zonesByCamera[cameraId] ?? []).length;
}

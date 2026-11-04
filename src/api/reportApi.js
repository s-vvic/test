// import { apiFetch, toApiError } from "./client";  // 서버 연결 후 주석 해제

/*
  통계 및 리포트 API — 서버 연결 후 주석 해제
  [명세 없음] ICD에 통계 API가 없다
  현재 Reports.jsx는 data/statisticsMock.js 목업 데이터 사용
*/

/* WEB-F-040 / WEB-F-042 통계 데이터 조회 (조건 적용)
   요청: startDate, endDate (YYYY-MM-DD), cameraId ("all" 또는 카메라 ID)
   응답: {
     total,
     trend:    [{ date, count }],
     byType:   [{ type, count }],
     byCamera: [{ cameraId, cameraName, location, count }],
     byHour:   [{ hour, count }]
   }

export async function getStatistics({ startDate, endDate, cameraId = "all" }) {
  const params = new URLSearchParams({ startDate, endDate });

  if (cameraId !== "all") {
    params.append("cameraId", cameraId);
  }

  const response = await apiFetch(`/statistics?${params.toString()}`);

  if (!response.ok) {
    throw await toApiError(response, "통계 데이터 조회 실패");
  }

  return response.json();
}
*/


/* WEB-F-041 카메라 / Device VPN 상태 요약
   응답: { totalCameras, onlineCameras, offlineCameras, vpnConnected, vpnDisconnected, vpnError }

export async function getStatusSummary() {
  const response = await apiFetch(`/statistics/status-summary`);

  if (!response.ok) {
    throw await toApiError(response, "상태 요약 조회 실패");
  }

  return response.json();
}
*/


/* WEB-F-043 통계 리포트 다운로드
   format: csv | pdf | xlsx
   응답: 파일(blob)

export async function downloadReport({ startDate, endDate, cameraId = "all", format = "csv" }) {
  const params = new URLSearchParams({ startDate, endDate, format });

  if (cameraId !== "all") {
    params.append("cameraId", cameraId);
  }

  const response = await apiFetch(`/statistics/report?${params.toString()}`);

  if (!response.ok) {
    throw await toApiError(response, "리포트 다운로드 실패");
  }

  return response.blob();
}
*/

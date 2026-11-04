// import { apiFetch, toApiError } from "./client";  // 서버 연결 후 주석 해제

/*
  저장 파일 API (ICD 2.4) — 서버 연결 후 주석 해제
  저장소 설정(2.4.3)은 api/settingsApi.js 의 getStorageSettings / updateStorageSettings
*/

/* 2.4.1 저장 파일 목록 조회
   filters: { mac, startDate, endDate, fileType (image | video), eventType, sort, page, size } 모두 선택
   응답: { total, page, size,
           items: [{ file_id, file_name, file_type, mac, device_name, created_at, file_size_bytes,
                     duration_sec, resolution, event_type, thumbnail_url, download_url }] }

export async function getStorageFiles({
  mac,
  startDate,
  endDate,
  fileType,
  eventType,
  sort,
  page,
  size
} = {}) {
  const query = {
    mac,
    start_date: startDate,
    end_date: endDate,
    file_type: fileType,
    event_type: eventType,
    sort,  // 기본값 created_at_desc
    page,
    size
  };

  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value != null && value !== "")
  );
  const queryString = params.toString();

  const response = await apiFetch(`/storage/files${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw await toApiError(response, "저장 파일 목록 조회 실패");
  }

  return response.json();
}
*/


/* 2.4.2 파일 단건 / 다중 삭제

export async function deleteStorageFiles(fileIds) {
  const response = await apiFetch(`/storage/files`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ file_ids: fileIds })
  });

  if (!response.ok) {
    throw await toApiError(response, "파일 삭제 실패");
  }
}
*/

import { apiFetch, toApiError } from "./client";

// 서버 응답(snake_case)을 이벤트 로그 화면에서 쓰는 모양으로 바꾼다
function toEvent(item) {
  return {
    id: item.event_id,
    occurredAt: item.occurred_at,
    cameraId: item.mac,
    cameraName: item.device_name,
    type: item.event_type,  // motion / sound / connection / system
    status: item.status,    // unconfirmed / confirmed
    snapshotUrl: item.snapshot_url ?? null,
    videoUrl: item.clip_url ?? null,
    soundLevelDb: item.sound_level_db ?? null,
    zoneId: item.zone_id ?? null
  };
}

// 2.3.1 이벤트 목록 조회 (페이지네이션)
// filters: { page, size, startDate, endDate (YYYY-MM-DD), mac, eventType, status } 모두 선택
// 응답: { total, page, size, items: [이벤트] }
export async function getEvents({
  page,
  size,
  startDate,
  endDate,
  mac,
  eventType,
  status
} = {}) {
  const query = {
    page,
    size,
    start_date: startDate,
    end_date: endDate,
    mac,
    event_type: eventType,
    status
  };

  // 값이 없는 조건은 쿼리에서 뺀다
  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value != null && value !== "")
  );
  const queryString = params.toString();

  const response = await apiFetch(`/events${queryString ? `?${queryString}` : ""}`);

  if (!response.ok) {
    throw await toApiError(response, "이벤트 조회 실패");
  }

  const data = await response.json();

  return {
    total: data.total,
    page: data.page,
    size: data.size,
    items: data.items.map(toEvent)
  };
}


/* ===== 추가 예정 API — 서버 연결 후 주석 해제 ===== */

/* 2.3.2 이벤트 상태 처리 (WEB-F-031)
   changes: { status: "confirmed", isImportant, memo (최대 500자) } 중 바꿀 항목만

export async function updateEvent(eventId, { status, isImportant, memo }) {
  const response = await apiFetch(`/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status,
      is_important: isImportant,
      memo
    })
  });

  if (!response.ok) {
    throw await toApiError(response, "이벤트 상태 변경 실패");
  }
}

export async function updateEventStatus(eventId, status) {
  return updateEvent(eventId, { status });
}
*/


/* WEB-F-033 이벤트 처리 상태 일괄 변경
   명세에 일괄 변경 API가 없어서 2.3.2를 이벤트마다 호출한다
   응답: { updatedIds: [], failedIds: [] }

export async function bulkUpdateEventStatus(eventIds, status) {
  const results = await Promise.allSettled(
    eventIds.map((eventId) => updateEvent(eventId, { status }))
  );

  return {
    updatedIds: eventIds.filter((_, index) => results[index].status === "fulfilled"),
    failedIds: eventIds.filter((_, index) => results[index].status === "rejected")
  };
}
*/


/* WEB-F-032 이벤트 미디어(스냅샷/영상) 접근 정보 조회 [명세 없음]
   2.3.1 목록 응답의 snapshot_url / clip_url(→ snapshotUrl / videoUrl)로 대신할 수 있다
   응답: { snapshot: { url, fileName }, video: { url, fileName, duration } }

export async function getEventMedia(eventId) {
  const response = await apiFetch(`/events/${eventId}/media`);

  if (!response.ok) {
    throw await toApiError(response, "이벤트 미디어 조회 실패");
  }

  return response.json();
}
*/


/* WEB-F-032 이벤트 미디어 다운로드 [명세 없음]
   mediaType: snapshot | video
   응답: 파일(blob)

export async function downloadEventMedia(eventId, mediaType) {
  const response = await apiFetch(
    `/events/${eventId}/media/${mediaType}/download`
  );

  if (!response.ok) {
    throw await toApiError(response, "이벤트 미디어 다운로드 실패");
  }

  return response.blob();
}
*/

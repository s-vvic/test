// import { apiFetch, toApiError } from "./client";  // 서버 연결 후 주석 해제

/*
  프라이버시 존 API (ICD 2.6 / WEB-F-024, WEB-F-064) — 서버 연결 후 주석 해제
  현재는 data/privacyZoneStore.js 목업 저장소 사용

  화면 zone: { id, name, x, y, width, height, enabled, color }
  서버 zone: { zone_id, zone_name, is_active, color, coordinates: { x1, y1, x2, y2 } }
  좌표는 모두 영상 크기 대비 비율 (0 ~ 1). 보드 1개당 최대 20개
*/

/* 서버 ↔ 화면 모양 변환

function toZone(item) {
  const { x1, y1, x2, y2 } = item.coordinates;

  return {
    id: item.zone_id,
    name: item.zone_name,
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    enabled: item.is_active,
    color: item.color
  };
}

function toZoneBody(zone) {
  return {
    zone_name: zone.name,
    is_active: zone.enabled,
    ...(zone.color && { color: zone.color }),
    coordinates: {
      x1: zone.x,
      y1: zone.y,
      x2: zone.x + zone.width,
      y2: zone.y + zone.height
    }
  };
}

function zonePath(mac, zoneId = "") {
  return `/devices/${encodeURIComponent(mac)}/privacy-zones${zoneId && `/${encodeURIComponent(zoneId)}`}`;
}
*/


/* 2.6.1 보드별 프라이버시 존 목록 조회

export async function getPrivacyZones(mac) {
  const response = await apiFetch(zonePath(mac));

  if (!response.ok) {
    throw await toApiError(response, "프라이버시 존 조회 실패");
  }

  const data = await response.json();

  return data.map(toZone);
}
*/


/* 2.6.2 프라이버시 존 추가

export async function addPrivacyZone(mac, zone) {
  const response = await apiFetch(zonePath(mac), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(toZoneBody(zone))
  });

  if (!response.ok) {
    throw await toApiError(response, "프라이버시 존 추가 실패");
  }
}
*/


/* 2.6.3 프라이버시 존 수정

export async function updatePrivacyZone(mac, zone) {
  const response = await apiFetch(zonePath(mac, zone.id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(toZoneBody(zone))
  });

  if (!response.ok) {
    throw await toApiError(response, "프라이버시 존 수정 실패");
  }
}
*/


/* 2.6.3 프라이버시 존 단건 삭제

export async function deletePrivacyZone(mac, zoneId) {
  const response = await apiFetch(zonePath(mac, zoneId), {
    method: "DELETE"
  });

  if (!response.ok) {
    throw await toApiError(response, "프라이버시 존 삭제 실패");
  }
}
*/


/* 2.6.3 프라이버시 존 다중 삭제

export async function deletePrivacyZones(mac, zoneIds) {
  const response = await apiFetch(zonePath(mac), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ zone_ids: zoneIds })
  });

  if (!response.ok) {
    throw await toApiError(response, "프라이버시 존 삭제 실패");
  }
}
*/


/* 보드별 프라이버시 존 일괄 저장 (추가 · 수정 · 삭제 반영)
   명세에 일괄 저장 API가 없어서, 서버 목록과 비교해 2.6.2 / 2.6.3을 나눠 호출한다
   응답: { applied: boolean, zones: [...] }

export async function savePrivacyZones(mac, zones) {
  const serverZones = await getPrivacyZones(mac);
  const serverById = new Map(serverZones.map((zone) => [zone.id, zone]));
  const keptIds = new Set(zones.map((zone) => zone.id));

  const removedIds = serverZones
    .filter((zone) => !keptIds.has(zone.id))
    .map((zone) => zone.id);

  if (removedIds.length > 0) {
    await deletePrivacyZones(mac, removedIds);
  }

  for (const zone of zones) {
    const serverZone = serverById.get(zone.id);

    if (!serverZone) {
      await addPrivacyZone(mac, zone);
    } else if (JSON.stringify(toZoneBody(zone)) !== JSON.stringify(toZoneBody(serverZone))) {
      await updatePrivacyZone(mac, zone);
    }
  }

  return { applied: true, zones: await getPrivacyZones(mac) };
}
*/

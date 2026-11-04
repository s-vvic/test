import { apiFetch, toApiError } from "./client";

/* 일반 설정 [명세 없음] */
export async function getGeneralSettings() {
  const response = await apiFetch(`/general-settings`);

  if (!response.ok) {
    throw await toApiError(response, "일반 설정 정보 조회 실패");
  }

  return response.json();
}

export async function updateGeneralSetting(key, value) {
  const response = await apiFetch(`/general-settings/${key}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ value })
  });

  if (!response.ok) {
    throw await toApiError(response, "설정 업데이트 실패");
  }
}


/* 알림 설정 (ICD 2.7) */

// 서버 응답(snake_case)을 알림 설정 화면에서 쓰는 모양으로 바꾼다
function toNotificationSettings(data) {
  return {
    motion: data.motion_alert,
    sound: data.sound_alert,
    offline: data.offline_alert,
    reconnect: data.reconnect_alert,
    importantOnly: data.important_only,
    deviceAlerts: (data.device_alerts ?? []).map((item) => ({
      mac: item.mac,
      enabled: item.enabled
    }))
  };
}

// 2.7.1 알림 설정 조회
export async function getNotificationSettings() {
  const response = await apiFetch(`/notifications/settings`);

  if (!response.ok) {
    throw await toApiError(response, "알림 설정 정보 조회 실패");
  }

  return toNotificationSettings(await response.json());
}

// 2.7.2 알림 설정 수정 — 항목별 수정이 없어서 전체 설정을 한 번에 저장한다
export async function updateNotificationSettings(settings) {
  const response = await apiFetch(`/notifications/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      motion_alert: settings.motion,
      sound_alert: settings.sound,
      offline_alert: settings.offline,
      reconnect_alert: settings.reconnect,
      important_only: settings.importantOnly,
      device_alerts: (settings.deviceAlerts ?? []).map((item) => ({
        mac: item.mac,
        enabled: item.enabled
      }))
    })
  });

  if (!response.ok) {
    throw await toApiError(response, "설정 변경 실패");
  }
}


/* 구독 설정 [명세 없음] */
export async function updateAutoRenew(enabled) {
  const response = await apiFetch(`/subscriptions/auto-renew`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ enabled })
  });

  if (!response.ok) {
    throw await toApiError(response, "자동 갱신 변경 실패");
  }
}


/* ===== 추가 예정 API — 서버 연결 후 주석 해제 ===== */

/* WEB-F-061 구독 정보 조회 [명세 없음]
   응답: { plan, status, paymentStatus, nextPaymentDate, autoRenew }

export async function getSubscription() {
  const response = await apiFetch(`/subscriptions`);

  if (!response.ok) {
    throw await toApiError(response, "구독 정보 조회 실패");
  }

  return response.json();
}
*/


/* WEB-F-061 구독 플랜 변경 [명세 없음]

export async function changeSubscriptionPlan(planId) {
  const response = await apiFetch(`/subscriptions/plan`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ planId })
  });

  if (!response.ok) {
    throw await toApiError(response, "요금제 변경 실패");
  }

  return response.json();
}
*/


/* WEB-F-061 결제 수단 조회 / 등록 / 기본 결제 수단 변경 / 삭제 [명세 없음]
   카드 정보는 PG사 결제창(토큰화)으로 등록 — 프론트에서 카드 번호를 직접 전송하지 않음

export async function getPaymentMethods() {
  const response = await apiFetch(`/payment-methods`);

  if (!response.ok) {
    throw await toApiError(response, "결제 수단 조회 실패");
  }

  return response.json();
}

export async function addPaymentMethod(billingKey) {
  const response = await apiFetch(`/payment-methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ billingKey })
  });

  if (!response.ok) {
    throw await toApiError(response, "결제 수단 등록 실패");
  }

  return response.json();
}

export async function setDefaultPaymentMethod(paymentMethodId) {
  const response = await apiFetch(`/payment-methods/${paymentMethodId}/default`, {
    method: "PATCH"
  });

  if (!response.ok) {
    throw await toApiError(response, "기본 결제 수단 변경 실패");
  }
}

export async function deletePaymentMethod(paymentMethodId) {
  const response = await apiFetch(`/payment-methods/${paymentMethodId}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw await toApiError(response, "결제 수단 삭제 실패");
  }
}
*/


/* WEB-F-063 저장소 설정 조회 / 변경 (ICD 2.4.3)
   화면 화질 low / medium / high ↔ 서버 video_quality SD / HD / FHD
   saveMode, overwriteWhenFull, usage.byType은 명세에 없어서 주고받지 않는다
   응답: { autoSave, quality, retentionDays, usage: { totalGb, usedGb } }

const QUALITY_TO_SERVER = { low: "SD", medium: "HD", high: "FHD" };
const QUALITY_FROM_SERVER = { SD: "low", HD: "medium", FHD: "high" };

// 2.4.3.1 저장소 설정 및 사용량 조회
export async function getStorageSettings() {
  const response = await apiFetch(`/storage/settings`);

  if (!response.ok) {
    throw await toApiError(response, "저장소 설정 조회 실패");
  }

  const data = await response.json();

  return {
    autoSave: data.auto_save_enabled,
    quality: QUALITY_FROM_SERVER[data.video_quality] ?? "high",
    retentionDays: data.retention_days,
    usage: {
      totalGb: data.storage_total_gb,
      usedGb: data.storage_used_gb
    }
  };
}

// 2.4.3.2 저장소 설정 수정. 응답 본문이 명세에 없어서 저장 후 다시 조회해 돌려준다
export async function updateStorageSettings({ autoSave, quality, retentionDays }) {
  const response = await apiFetch(`/storage/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      auto_save_enabled: autoSave,
      retention_days: retentionDays,
      video_quality: QUALITY_TO_SERVER[quality]
    })
  });

  if (!response.ok) {
    throw await toApiError(response, "저장소 설정 변경 실패");
  }

  return getStorageSettings();
}
*/

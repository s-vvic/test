// 서버 시각 값은 UTC(ISO 8601, 예: 2026-08-12T11:51:32Z)로 온다
// 화면에는 PC 시간대와 관계없이 항상 한국 시간(KST, Asia/Seoul)으로 "YYYY-MM-DD HH:mm:ss" 형태로 보여 준다
const pad = (value) => String(value).padStart(2, "0");

const KST_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// 시간대 표시가 없는 ISO 문자열(2026-08-12T11:51:32)은 브라우저가 PC 시간으로 읽어 버리므로 UTC로 읽게 Z를 붙인다
function parseUtc(value) {
  if (value instanceof Date) {
    return value;
  }

  const text = String(value).trim();
  const isIsoDateTime = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(text);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(text);

  return new Date(isIsoDateTime && !hasZone ? `${text.replace(" ", "T")}Z` : text);
}

// 값이 없으면 empty, 해석할 수 없는 문자열이면 받은 그대로 돌려준다
export function formatDateTime(value, { empty = "-" } = {}) {
  if (value === undefined || value === null || value === "") {
    return empty;
  }

  const date = parseUtc(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const parts = Object.fromEntries(
    KST_FORMAT.formatToParts(date).map(({ type, value: part }) => [type, part])
  );

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

// last_seen 전용: 한 번도 heartbeat를 받지 못한 보드(null)는 "기록 없음"
export const LAST_SEEN_EMPTY = "기록 없음";

export function formatLastSeen(value) {
  return formatDateTime(value, { empty: LAST_SEEN_EMPTY });
}

// 2.2.3 보드 상태 조회의 uptime_seconds → "3일 12시간 24분"
export function formatUptime(seconds) {
  if (seconds === undefined || seconds === null || seconds === "") {
    return "-";
  }

  const total = Math.max(0, Math.floor(Number(seconds)));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  return days > 0
    ? `${days}일 ${hours}시간 ${pad(minutes)}분`
    : `${hours}시간 ${pad(minutes)}분`;
}

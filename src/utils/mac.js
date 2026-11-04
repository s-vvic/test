// MAC 주소 형식
// - 서버 저장 · 전송 형식: 대문자, 콜론 없는 12자리 (예: 001A2B3C4D5E)
// - 화면 표시 형식: 두 자리마다 콜론 (예: 00:1A:2B:3C:4D:5E)
// - device_id (I1 예외): "CAM-" + MAC 끝 4자리 (예: CAM-4D5E)

// 어떤 형식으로 들어와도(콜론 · 하이픈 · 소문자) 서버 형식으로 바꾼다
export function normalizeMac(value) {
  return String(value ?? "").replace(/[^0-9a-f]/gi, "").toUpperCase();
}

// 화면 표시용. 12자리가 아니면 받은 값을 그대로 보여 준다
export function formatMac(value) {
  const hex = normalizeMac(value);

  if (hex.length !== 12) {
    return value ?? "";
  }

  return hex.match(/.{2}/g).join(":");
}

export function deviceIdFromMac(value) {
  return `CAM-${normalizeMac(value).slice(-4)}`;
}

// 지금 보이는 보드 목록이 어디서 왔는지 표시 (useCameraList의 source)
import "./CameraSourceBadge.css";

const pad = (value) => String(value).padStart(2, "0");
const formatClock = (date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

function sourceLabel(source, fetchedAt) {
  switch (source) {
    case "server":
      return `서버 데이터 · ${formatClock(fetchedAt)} 갱신 · 5초마다 자동 갱신`;
    case "stale":
      return `서버 응답 없음 · ${formatClock(fetchedAt)} 데이터 표시 중`;
    case "mock":
      return "목업 데이터 (서버 연결 실패 · 5초마다 재시도)";
    default:
      return "서버에서 불러오는 중...";
  }
}

function CameraSourceBadge({ source, fetchedAt, className = "" }) {
  return (
    <span className={`camera-source ${source} ${className}`.trim()}>
      <span className="camera-source-dot" aria-hidden="true" />
      {sourceLabel(source, fetchedAt)}
    </span>
  );
}

export default CameraSourceBadge;

// 보드 썸네일 (ICD 2.2.1 thumbnail_url)
// thumbnail_url이 null / 빈 값이거나, 주소는 있지만 이미지를 불러오지 못하면 기본 이미지를 보여 준다
import { useEffect, useState } from "react";
import defaultThumbnail from "../assets/default-thumbnail.svg";
import { API_BASE_URL } from "../api/config";

// 서버가 "/thumbnails/a.jpg"처럼 경로만 주면 API 서버 주소를 기준으로 완성한다
function resolveThumbnailUrl(url) {
  const text = typeof url === "string" ? url.trim() : "";

  if (!text) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(text)) {
    return text;
  }

  try {
    return new URL(text, `${API_BASE_URL}/`).href;
  } catch {
    return null;
  }
}

function CameraThumbnail({ url, alt = "", className = "" }) {
  const src = resolveThumbnailUrl(url);
  const [ failed, setFailed ] = useState(false);

  // 주소가 바뀌면 다시 시도
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const useDefault = !src || failed;

  return (
    <img
      className={`camera-thumbnail ${useDefault ? "is-default" : ""} ${className}`.trim()}
      src={useDefault ? defaultThumbnail : src}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default CameraThumbnail;

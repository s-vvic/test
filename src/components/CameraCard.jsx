//멀티뷰 카메라 한 채널
import { useRef, useState } from "react";
import "./CameraCard.css";
import {
  FiMoreHorizontal,
  FiVideoOff,
  FiMapPin,
  FiShield,
  FiMaximize2,
} from "react-icons/fi";
import { useFloating, offset, flip, shift, autoUpdate, useClick, useDismiss, useInteractions } from "@floating-ui/react";
import { useNavigate } from "react-router-dom";
import { VPN_STATUS_META } from "./charts/chartColors";
import useWebRtcStream from "../hooks/useWebRtcStream";
import { formatDateTime, formatLastSeen } from "../utils/formatDateTime";
import CameraThumbnail from "./CameraThumbnail";
import { formatMac } from "../utils/mac";

const pad = (value) => String(value).padStart(2, "0");

function formatTimestamp(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// VPN 상태 이름은 모든 화면 공통 (정상 / 연결 끊김 / 오류)
const vpnLabel = (status) => VPN_STATUS_META[status]?.label ?? status;

function CameraCard({
  camera,
  channel,
  now,
  recentEvent,
  highlighted = false,
  streamUrl = null,
}) {

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const navigate = useNavigate();

  const isOnline = camera.status === "online";

  // 저해상도 실시간 영상 (WebRTC / WHEP) — 오프라인 카메라는 연결하지 않음
  const videoRef = useRef(null);
  const streamStatus = useWebRtcStream(
    videoRef,
    isOnline ? streamUrl : null
  );

  const {refs, floatingStyles, context} = useFloating({
    open: isDetailOpen,
    onOpenChange: setIsDetailOpen,

    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,

    middleware: [
      offset(8),
      flip(),
      shift({padding: 10 }),
    ],
  });

  const click = useClick(context);

  const dismiss = useDismiss(context, {
    outsidePress: true,
    escapeKey: true,
  });

  const {
    getReferenceProps,
    getFloatingProps,
  } = useInteractions([click, dismiss]);

  function openMonitoring() {
    navigate(`/Monitoring/${camera.device_id}`);
  }

  // last_seen은 UTC → KST, null이면 "기록 없음"
  const lastSeen = formatLastSeen(camera.last_seen);

  const details = [
    ["보드 ID", camera.device_id],
    ["MAC", camera.mac ? formatMac(camera.mac) : null],
    ["VPN IP", camera.vpn_ip],
    ["펌웨어", camera.firmware_version],
    ["최근 이벤트", recentEvent ?? (camera.latest_event_time ? formatDateTime(camera.latest_event_time) : "-")],
    ["마지막 수신", lastSeen],
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  return (
    <article
      className={[
        "cam-card",
        camera.status,
        highlighted ? "highlighted" : "",
      ].join(" ").trim()}
    >
      <div
        className="cam-video"
        role="button"
        tabIndex={0}
        onClick={openMonitoring}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMonitoring();
          }
        }}
        aria-label={`${camera.name} 실시간 모니터링 열기`}
      >
        {/* WEB-F-012 멀티뷰는 저해상도 스트림 재생 — streamUrl 은 getLowResStreams() 응답의 WHEP 주소 */}
        {isOnline && streamStatus !== "idle" ? (
          <>
            <video
              ref={videoRef}
              className="cam-stream"
              autoPlay
              muted
              playsInline
              disablePictureInPicture
            />

            {streamStatus !== "connected" && (
              <div className={`cam-stream-status ${streamStatus}`}>
                {streamStatus === "connecting" ? "연결 중..." : "연결 실패"}
              </div>
            )}
          </>
        ) : isOnline ? (
          // 스트림이 없으면 썸네일 (thumbnail_url이 비어 있으면 기본 이미지)
          <CameraThumbnail
            url={camera.thumbnail_url}
            alt={`${camera.name} 썸네일`}
            className="cam-thumbnail"
          />
        ) : (
          <>
            <CameraThumbnail url={camera.thumbnail_url} className="cam-thumbnail offline" />

            <div className="cam-no-signal">
              <FiVideoOff />
              <strong>신호 없음</strong>
              <small>마지막 수신 {lastSeen}</small>
            </div>
          </>
        )}

        <div className="cam-overlay-top">
          <span className={`cam-live-badge ${camera.status}`}>
            <span className="cam-live-dot" />
            {isOnline ? "LIVE" : "OFFLINE"}
          </span>

          {channel !== undefined && (
            <span className="cam-channel">CH {pad(channel)}</span>
          )}

          <span className="cam-overlay-spacer" />

          {isOnline && now && (
            <span className="cam-time">{formatTimestamp(now)}</span>
          )}

          <span className="stream-quality-badge">SD</span>
        </div>

        {isOnline && (
          <div className="cam-hover">
            <FiMaximize2 />
            실시간 보기
          </div>
        )}
      </div>

      <div className="cam-info">
        <div className="cam-name-group">
          <strong>{camera.name}</strong>
          {camera.location && (
            <small>
              <FiMapPin />
              {camera.location}
            </small>
          )}
        </div>

        <div className="cam-actions">
          {camera.vpn_status && (
            <span
              className={`cam-vpn ${camera.vpn_status}`}
              title={`VPN ${vpnLabel(camera.vpn_status)}`}
              aria-label={`VPN ${vpnLabel(camera.vpn_status)}`}
            >
              <FiShield />
            </span>
          )}

          <button
            type="button"
            ref={refs.setReference}
            className={`cam-icon-button ${isDetailOpen ? "active" : ""}`}
            aria-label="카메라 정보"
            {...getReferenceProps()}
          >
            <FiMoreHorizontal />
          </button>
        </div>
      </div>

      {isDetailOpen && (
        <div
          ref={refs.setFloating}
          className="cam-popover"
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <div className="cam-popover-header">
            <strong>{camera.name}</strong>
            <span className={`cam-popover-status ${camera.status}`}>
              {isOnline ? "온라인" : "오프라인"}
            </span>
          </div>

          <dl className="cam-popover-list">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {camera.vpn_status && (
              <div>
                <dt>VPN</dt>
                <dd className={`cam-vpn-text ${camera.vpn_status}`}>
                  {vpnLabel(camera.vpn_status)}
                </dd>
              </div>
            )}
          </dl>

          <button type="button" className="cam-popover-action" onClick={openMonitoring}>
            <FiMaximize2 />
            실시간 모니터링
          </button>
        </div>
      )}
    </article>
  );
}

export default CameraCard;

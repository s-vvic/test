import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  FiVideo,
  FiWifi,
  FiWifiOff,
  FiShield,
  FiShieldOff,
  FiInfo,
  FiEdit2,
  FiTag,
  FiMapPin,
  FiCpu,
  FiHash,
  FiBox,
  FiLayers,
  FiActivity,
  FiClock,
  FiTrendingUp,
  FiEyeOff,
  FiGrid,
  FiRefreshCw,
  FiZoomIn,
  FiZoomOut,
  FiRotateCcw,
  FiChevronLeft,
} from "react-icons/fi";

import "./Monitoring.css";
import { VPN_STATUS_META } from "../components/charts/chartColors";
import useCameraList from "../hooks/useCameraList";
import EditableCameraName from "../components/EditableCameraName";
import PrivacyZoneModal from "../components/privacy/PrivacyZoneModal";
import { getZones } from "../data/privacyZoneStore";
import useWebRtcStream from "../hooks/useWebRtcStream";
import { formatLastSeen, formatUptime } from "../utils/formatDateTime";
import { formatMac } from "../utils/mac";
import useDigitalZoom, { MIN_ZOOM, MAX_ZOOM } from "../hooks/useDigitalZoom";

function Monitoring() {
  const { cameraId } = useParams();
  const navigate = useNavigate();

  // 보드 목록 — 5초마다 자동 재조회해서 상태 / 마지막 수신 시간을 갱신한다
  const { cameras, source } = useCameraList();

  // URL의 :cameraId는 문자열이라 device_id(숫자 또는 문자열)와 문자열로 비교한다
  const liveCamera = cameras.find(
    (item) => String(item.device_id) === cameraId
  );

  // 이름은 아직 화면에서만 수정 (자동 재조회가 덮어쓰지 않도록 따로 둔다)
  const [nameOverride, setNameOverride] = useState(null);

  const camera = liveCamera
    ? { ...liveCamera, ...(nameOverride !== null && { name: nameOverride }) }
    : null;

  const [currentTime, setCurrentTime] = useState(new Date());

  const [isEditingName, setIsEditingName] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streamKey, setStreamKey] = useState(0);

  // 실시간 영상 (WebRTC / WHEP)
  // 나중에 서버 연결 시 camera.webrtcUrl 에 WHEP 엔드포인트 주소 (예: http://<서버>:8889/cam1/whep)
  const videoRef = useRef(null);
  const streamStatus = useWebRtcStream(
    videoRef,
    liveCamera?.webrtcUrl ?? null,
    streamKey
  );

  // 디지털 줌
  const stageRef = useRef(null);
  const zoom = useDigitalZoom(stageRef);

  // 프라이버시 존 (WEB-F-024)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [privacyZones, setPrivacyZones] = useState(() =>
    getZones(cameraId)
  );


  // URL에서 다른 카메라로 이동했을 때 정보 갱신
  useEffect(() => {
    setNameOverride(null);
    setIsEditingName(false);
    setPrivacyZones(getZones(cameraId));
    zoom.reset();
  }, [cameraId]);


  // 현재 날짜 / 시간
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  if (!camera) {
    return (
      <main className="monitoring-page">
        <p>{source === "loading" ? "카메라 정보를 불러오는 중..." : "찾을 수 없는 카메라입니다."}</p>

        <button
          type="button"
          onClick={() => navigate("/multiview")}
        >
          Back to MultiView
        </button>
      </main>
    );
  }


  // 이름 수정
  function handleNameSave(newName) {
    setNameOverride(newName);

    setIsEditingName(false);

    // 나중에 API
    // await updateCameraName(camera.mac, newName);
  }


  // 스트림 새로고침
  function handleStreamRefresh() {
    if (isRefreshing) return;

    setIsRefreshing(true);

    // streamKey 가 바뀌면 useWebRtcStream 이 WebRTC 연결을 끊고 다시 연결
    setStreamKey((prev) => prev + 1);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  }


  const formattedTime = currentTime.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });


  const isOnline = camera.status === "online";

  const isVpnConnected =
    camera.vpn_status === "connected";

  // VPN 상태 이름은 모든 화면 공통 (정상 / 연결 끊김 / 오류)
  const vpnStatusLabel =
    VPN_STATUS_META[camera.vpn_status]?.label ??
    (isVpnConnected ? VPN_STATUS_META.connected.label : VPN_STATUS_META.disconnected.label);


  return (
    <main className="monitoring-page">

      {/* 상단 카메라 상태 */}
      <div className="monitoring-header">

        <div className="monitoring-title-area">
          <span className="monitoring-title-icon">
            <FiVideo />
          </span>

          <h2>{camera.name}</h2>

          <span className="live-badge">
            <span className="live-dot" />
            LIVE
          </span>

          <span
            className={`connection-badge ${
              isOnline ? "connected" : "disconnected"
            }`}
          >
            {isOnline ? <FiWifi /> : <FiWifiOff />}
            {isOnline ? "Online" : "Offline"}
          </span>

          <span
            className={`connection-badge ${
              isVpnConnected
                ? "connected"
                : "disconnected"
            }`}
          >
            {isVpnConnected ? <FiShield /> : <FiShieldOff />}
            VPN {vpnStatusLabel}
          </span>
        </div>

        <button
          type="button"
          className="back-to-multiview-button"
          onClick={() => navigate("/multiview")}
        >
          <FiChevronLeft />
          멀티뷰
        </button>

      </div>


      <div className="monitoring-content">

        {/* ================= 영상 영역 ================= */}

        <section className="video-section">

          <div className="real-time-video">

            {/* 줌 영역 — 영상과 프라이버시 존 마스크를 같이 확대해야 위치가 어긋나지 않음 */}
            <div
              ref={stageRef}
              className={`zoom-stage${zoom.isZoomed ? " zoomed" : ""}${
                zoom.isPanning ? " panning" : ""
              }`}
              {...zoom.stageHandlers}
            >
              <div
                className="zoom-layer"
                style={zoom.layerStyle}
              >

                {streamStatus === "idle" ? (
                  <div className="video-placeholder">
                    <FiVideo />
                    Video Stream
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="video-player"
                    autoPlay
                    muted
                    playsInline
                    disablePictureInPicture
                  />
                )}

                {/* 프라이버시 존 마스킹 표시 */}
                {privacyZones
                  .filter((zone) => zone.enabled)
                  .map((zone) => (
                    <div
                      key={zone.id}
                      className="privacy-mask"
                      style={{
                        left: `${zone.x * 100}%`,
                        top: `${zone.y * 100}%`,
                        width: `${zone.width * 100}%`,
                        height: `${zone.height * 100}%`,
                      }}
                      title={zone.name}
                    />
                  ))}

              </div>
            </div>


            {/* 연결 상태 안내 */}

            {(streamStatus === "connecting" || streamStatus === "failed") && (
              <div className={`stream-status ${streamStatus}`}>
                {streamStatus === "connecting"
                  ? "영상 연결 중..."
                  : "영상 연결에 실패했습니다. 새로고침을 눌러 다시 시도하세요."}
              </div>
            )}


            {/* 좌측 상단 LIVE + 현재시간 */}

            <div className="video-time">

              <span className="video-live">
                <span className="live-dot" />
                LIVE
              </span>

              <span>
                {formattedTime}
              </span>

            </div>


            {/* 왼쪽 하단 디지털 줌 */}

            <div
              className="zoom-controls"
              title="휠: 확대/축소 · 드래그: 이동 · 더블클릭: 2배/원래대로"
            >
              <button
                type="button"
                className="zoom-button"
                onClick={zoom.zoomOut}
                disabled={zoom.scale <= MIN_ZOOM}
                aria-label="축소"
              >
                <FiZoomOut />
              </button>

              <span className="zoom-level">
                {Math.round(zoom.scale * 100)}%
              </span>

              <button
                type="button"
                className="zoom-button"
                onClick={zoom.zoomIn}
                disabled={zoom.scale >= MAX_ZOOM}
                aria-label="확대"
              >
                <FiZoomIn />
              </button>

              <button
                type="button"
                className="zoom-button"
                onClick={zoom.reset}
                disabled={!zoom.isZoomed}
                aria-label="원래 크기"
              >
                <FiRotateCcw />
              </button>
            </div>


            {/* 오른쪽 하단 새로고침 */}

            <button
              type="button"
              className="stream-refresh-button"
              onClick={handleStreamRefresh}
            >
              <span
                className={
                  isRefreshing
                    ? "stream-refresh-icon rotating"
                    : "stream-refresh-icon"
                }
              >
                <FiRefreshCw />
              </span>

              {isRefreshing
                ? "재연결 중"
                : "새로고침"}
            </button>

          </div>

        </section>


        {/* ================= 정보 영역 ================= */}

        <aside className="camera-info-panel">

          <div className="info-panel-header">

            <h3>
              <FiInfo />
              카메라 정보
            </h3>

            <button
              type="button"
              className="edit-name-button"
              onClick={() => setIsEditingName(true)}
              disabled={isEditingName}
              aria-hidden={isEditingName}
              tabIndex={isEditingName ? -1 : 0}
            >
              <FiEdit2 />
              이름 수정
            </button>

          </div>


          {/* 이름 */}

          <div className="info-row">

            <span className="info-label">
              <FiTag />
              카메라 이름
            </span>

            <EditableCameraName
              className="info-name"
              initialName={camera.name}
              isEditing={isEditingName}
              onSave={handleNameSave}
              onCancel={() => setIsEditingName(false)}
            />

          </div>


          <div className="info-row">
            <span className="info-label">
              <FiMapPin />
              설치 위치
            </span>

            <span className="info-value">
              {camera.location ?? "-"}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiCpu />
              보드 ID
            </span>

            <span className="info-value">
              {camera.device_id ?? "-"}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiHash />
              MAC 주소
            </span>

            <span className="info-value">
              {camera.mac ? formatMac(camera.mac) : "-"}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiBox />
              VPN IP
            </span>

            <span className="info-value">
              {camera.vpn_ip ?? "-"}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiLayers />
              펌웨어 버전
            </span>

            <span className="info-value">
              {camera.firmware_version ?? "-"}
            </span>
          </div>


          {/* 상태 정보 */}

          <div className="info-section-title">
            <FiActivity />
            상태 정보
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiWifi />
              온라인 상태
            </span>

            <span
              className={`status-value ${
                isOnline ? "online" : "offline"
              }`}
            >
              <span className="status-dot" />

              {isOnline
                ? "Online"
                : "Offline"}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiShield />
              VPN 상태
            </span>

            <span
              className={`status-value ${
                isVpnConnected
                  ? "online"
                  : "offline"
              }`}
            >
              <span className="status-dot" />

              {vpnStatusLabel}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiClock />
              마지막 수신 시간
            </span>

            <span className="info-value">
              {formatLastSeen(camera.last_seen)}
            </span>
          </div>


          <div className="info-row">
            <span className="info-label">
              <FiTrendingUp />
              업타임
            </span>

            <span className="info-value">
              {/* 2.2.3 보드 상태 조회(uptime_seconds) 연결 전까지는 "-" */}
              {formatUptime(camera.uptime_seconds)}
            </span>
          </div>


          {/* 프라이버시 존 (WEB-F-024) */}

          <div className="info-section-title">
            <FiEyeOff />
            프라이버시 존
          </div>

          <div className="info-row">
            <span className="info-label">
              <FiGrid />
              설정된 영역
            </span>

            <span className="info-value">
              {privacyZones.length}개
              {" "}
              (활성 {privacyZones.filter((zone) => zone.enabled).length}개)
            </span>
          </div>

          <button
            type="button"
            className="privacy-zone-button"
            onClick={() => setIsPrivacyOpen(true)}
          >
            <FiEyeOff />
            프라이버시 존 설정
          </button>

        </aside>

      </div>

      {isPrivacyOpen && (
        <PrivacyZoneModal
          camera={camera}
          onClose={() => setIsPrivacyOpen(false)}
          onSaved={setPrivacyZones}
        />
      )}

    </main>
  );
}

export default Monitoring;
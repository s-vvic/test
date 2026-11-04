import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiVideo,
  FiWifi,
  FiWifiOff,
  FiActivity,
  FiBell,
  FiChevronRight,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";

import "./Dashboard.css";
import "../components/Modal.css";

import DonutChart from "../components/charts/DonutChart";
import { EVENT_TYPE_META, VPN_STATUS_META } from "../components/charts/chartColors";
import { useVpn } from "../context/VpnContext";
import useCameraList from "../hooks/useCameraList";

import { eventLogs } from "../data/eventLogs";
import {
  generateDashboardSummary,
  generateStatistics,
  getDeviceVpnList,
  toDateInputValue,
} from "../data/statisticsMock";

/* 서버 연결 후 주석 해제
import {
  getDashboardSummary,
  getRecentEvents,
  getEventTypeStats,
  getDeviceVpnStatusList,
} from "../api/dashboardApi";
*/

const PERIODS = [
  { key: "today", label: "오늘", days: 0 },
  { key: "week", label: "7일", days: 6 },
  { key: "month", label: "30일", days: 29 },
];

// 대시보드는 다른 목록 화면(5초)보다 느슨하게 10초마다 보드 목록을 다시 불러온다
const DASHBOARD_POLL_MS = 10000;

const CLIENT_VPN_TEXT = {
  connected: { label: "연결됨", desc: "VPN 내부 서버와 정상적으로 연결되어 있습니다." },
  connecting: { label: "확인 중", desc: "VPN 내부 서버 연결을 확인하고 있습니다..." },
  disconnected: { label: "연결 안 됨", desc: "VPN 연결 상태가 확인되지 않았습니다." },
  error: { label: "연결 오류", desc: "VPN 내부 서버에 연결할 수 없습니다. VPN 클라이언트를 확인해주세요." },
};

function Dashboard() {
  const navigate = useNavigate();
  const { peerVpnStatus, setPeerVpnStatus, checkClientVpn } = useVpn();

  const [period, setPeriod] = useState("today");
  const [vpnFilter, setVpnFilter] = useState("all");

  /* ---------- 목업 데이터 (서버 연결 후 API 응답으로 교체) ---------- */

  const unreadAlerts = eventLogs.filter((e) => e.status === "unconfirmed").length;

  // 보드 목록 (ICD 2.2.1) — 10초마다 재조회. 서버에 닿지 못하면 목업
  const { cameras, source } = useCameraList({ pollMs: DASHBOARD_POLL_MS });
  const isMockList = source === "loading" || source === "mock";

  // 카메라 대수(전체 / 온라인 / 오프라인)는 보드 목록으로 계산하고,
  // 오늘 이벤트 · 미확인 알림은 이벤트 API 연결 전까지 목업 값을 쓴다
  const summary = useMemo(() => {
    const mockSummary = generateDashboardSummary(unreadAlerts);
    const onlineCameras = cameras.filter((camera) => camera.status === "online").length;

    return {
      ...mockSummary,
      totalCameras: cameras.length,
      onlineCameras,
      offlineCameras: cameras.length - onlineCameras,
    };
  }, [cameras, unreadAlerts]);

  // 카드 높이만큼 채워서 보여주고, 화면이 작으면 목록 안에서만 스크롤
  const recentEvents = useMemo(
    () =>
      [...eventLogs]
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, 12),
    []
  );

  const typeStats = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period).days;
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const { byType } = generateStatistics({
      startDate: toDateInputValue(start),
      endDate: toDateInputValue(end),
    });

    return byType.map((item) => ({
      key: item.type,
      label: EVENT_TYPE_META[item.type].label,
      color: EVENT_TYPE_META[item.type].color,
      value: item.count,
    }));
  }, [period]);

  // Device VPN 상태: 목업일 때는 시연용 목록(오류 기기 포함), 서버 데이터일 때는 보드 목록의 vpn_status
  // (오류 유형까지 보려면 2.5.1 GET /vpn/connections 연결 필요)
  const vpnList = useMemo(
    () =>
      isMockList
        ? getDeviceVpnList()
        : cameras.map((camera) => ({
            cameraId: camera.device_id,
            cameraName: camera.name,
            location: camera.location,
            vpnStatus: camera.vpn_status ?? "disconnected",
            error: null,
          })),
    [cameras, isMockList]
  );

  const vpnStats = Object.entries(VPN_STATUS_META).map(([key, meta]) => {
    const value = vpnList.filter((d) => d.vpnStatus === key).length;

    return {
      key,
      label: meta.label,
      color: meta.color,
      value,
      percent: vpnList.length === 0 ? 0 : (value / vpnList.length) * 100,
    };
  });

  // 문제 있는 기기를 먼저 보여줌
  const statusOrder = { error: 0, disconnected: 1, connected: 2 };

  const filteredVpnList = vpnList
    .filter((d) => vpnFilter === "all" || d.vpnStatus === vpnFilter)
    .sort((a, b) => statusOrder[a.vpnStatus] - statusOrder[b.vpnStatus]);

  /*
  서버 연결 후 예시
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [summaryData, recent, vpn] = await Promise.all([
          getDashboardSummary(),
          getRecentEvents(12),
          getDeviceVpnStatusList(),
        ]);
        setSummary(summaryData);
        setRecentEvents(recent);
        setVpnList(vpn);
      } catch (error) {
        console.error(error);
      }
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    getEventTypeStats(period).then(setTypeStats).catch(console.error);
  }, [period]);
  */

  const clientVpn = CLIENT_VPN_TEXT[peerVpnStatus] ?? CLIENT_VPN_TEXT.disconnected;

  const summaryCards = [
    { key: "total", label: "전체 카메라", value: summary.totalCameras, unit: "대", icon: <FiVideo />, to: "/devices" },
    { key: "online", label: "온라인", value: summary.onlineCameras, unit: "대", icon: <FiWifi />, to: "/multiview", tone: "online" },
    { key: "offline", label: "오프라인", value: summary.offlineCameras, unit: "대", icon: <FiWifiOff />, to: "/multiview", tone: "offline" },
    { key: "today", label: "오늘 이벤트", value: summary.todayEvents, unit: "건", icon: <FiActivity />, to: "/event-logs" },
    { key: "unread", label: "미확인 알림", value: summary.unreadAlerts, unit: "건", icon: <FiBell />, to: "/event-logs", tone: "warning" },
  ];

  return (
    <main className="dashboard-page">

      {/* WEB-F-001 요약 */}
      <section className="dash-summary">
        {summaryCards.map((card) => (
          <button
            type="button"
            key={card.key}
            className={`dash-stat ${card.tone ?? ""}`}
            onClick={() => navigate(card.to)}
          >
            <span className="dash-stat-icon">{card.icon}</span>
            <span className="dash-stat-label">{card.label}</span>
            <strong className="dash-stat-value">
              {card.value}
              <small>{card.unit}</small>
            </strong>
          </button>
        ))}
      </section>


      <section className="dash-grid">

        {/* WEB-F-002 이벤트 현황 (유형별 현황 + 최근 이벤트) */}
        <article className="dash-card dash-events">
          <div className="dash-card-header">
            <h3>이벤트 현황</h3>
            <button type="button" className="dash-link" onClick={() => navigate("/event-logs")}>
              전체 보기 <FiChevronRight />
            </button>
          </div>

          <div className="dash-events-body">
            <section className="dash-pane dash-type-pane">
              <div className="dash-pane-header">
                <h4>유형별 발생</h4>

                <div className="dash-segment">
                  {PERIODS.map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      className={period === p.key ? "active" : ""}
                      onClick={() => setPeriod(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <DonutChart data={typeStats} size={230} thickness={28} centerLabel="전체 이벤트" />
            </section>

            <section className="dash-pane dash-recent-pane">
              <div className="dash-pane-header">
                <h4>최근 발생</h4>
              </div>

              <ul className="recent-event-list">
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <button type="button" onClick={() => navigate("/event-logs")}>
                      <span
                        className="recent-event-swatch"
                        style={{ backgroundColor: EVENT_TYPE_META[event.type]?.color }}
                      />
                      <div className="recent-event-main">
                        <strong>{EVENT_TYPE_META[event.type]?.label ?? event.type}</strong>
                        <span>
                          {event.cameraName} · {event.location}
                        </span>
                      </div>
                      <div className="recent-event-meta">
                        <small>{event.occurredAt.replace("T", " ").slice(5, 16)}</small>
                        <span className={`recent-event-status ${event.status}`}>
                          {event.status === "confirmed" ? "확인 완료" : "미확인"}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>


        {/* WEB-F-003 / WEB-F-004 VPN 연결 상태 (Client + Device) */}
        <article className="dash-card dash-vpn">
          <div className="dash-card-header">
            <h3>VPN 연결 상태</h3>
            <button type="button" className="dash-link" onClick={() => navigate("/vpn-manage")}>
              VPN 관리 <FiChevronRight />
            </button>
          </div>

          {/* Client VPN (이 PC) */}
          <div className={`client-vpn-strip ${peerVpnStatus}`}>
            <div className="client-vpn-icon">
              <FiShield />
            </div>

            <div className="client-vpn-text">
              <span className="client-vpn-caption">Client VPN · 이 PC</span>
              <strong className="client-vpn-label">{clientVpn.label}</strong>
              <p>{clientVpn.desc}</p>
            </div>

            <div className="client-vpn-actions">
              {peerVpnStatus === "error" && (
                <button type="button" className="btn small primary" onClick={() => navigate("/vpn-manage")}>
                  재연결 안내
                </button>
              )}

              <button
                type="button"
                className="btn small"
                onClick={checkClientVpn}
                disabled={peerVpnStatus === "connecting"}
              >
                <FiRefreshCw className={peerVpnStatus === "connecting" ? "spin" : ""} />
                연결 확인
              </button>

              {/* 시연용: 서버 연결 후 삭제 */}
              <button
                type="button"
                className="client-vpn-demo"
                onClick={() => setPeerVpnStatus("error")}
                title="연결 끊김 시뮬레이션"
              >
                <span className="demo-tag">DEMO</span> 끊김
              </button>
            </div>
          </div>

          {/* Device VPN (카메라) */}
          <section className="dash-pane dash-device-pane">
            <div className="dash-pane-header">
              <h4>Device VPN · 카메라</h4>

              <div className="dash-vpn-filter">
                {[["all", "전체"], ...Object.entries(VPN_STATUS_META).map(([k, m]) => [k, m.label])].map(
                  ([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={vpnFilter === key ? "active" : ""}
                      onClick={() => setVpnFilter(key)}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <ul className="dash-vpn-stats">
              {vpnStats.map((item) => (
                <li key={item.key}>
                  <span className="dash-vpn-stats-label">
                    <span className="legend-swatch" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <strong>
                    {item.value}
                    <small>대</small>
                  </strong>
                  <span className="dash-vpn-stats-percent">{item.percent.toFixed(1)}%</span>
                </li>
              ))}
            </ul>

            <ul className="dash-vpn-list">
              {filteredVpnList.map((device) => (
                <li key={device.cameraId}>
                  <span className="dash-vpn-name">
                    {device.cameraName}
                    <small>{device.cameraId}</small>
                  </span>
                  <span className={`dash-vpn-status ${device.vpnStatus}`}>
                    <span className="status-dot" />
                    {VPN_STATUS_META[device.vpnStatus].label}
                  </span>
                </li>
              ))}
              {filteredVpnList.length === 0 && (
                <li className="dash-empty">해당 상태의 기기가 없습니다.</li>
              )}
            </ul>
          </section>
        </article>

      </section>
    </main>
  );
}

export default Dashboard;

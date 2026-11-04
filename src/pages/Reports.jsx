import { useMemo, useState } from "react";
import {
  FiDownload,
  FiPrinter,
  FiSearch,
  FiActivity,
  FiBarChart2,
  FiTag,
  FiClock,
  FiWifi,
  FiShield,
  FiTrendingUp,
  FiPieChart,
  FiAward,
  FiMaximize2,
} from "react-icons/fi";

import "./Reports.css";
import "../components/Modal.css";

import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import DonutChart from "../components/charts/DonutChart";
import RankBars from "../components/charts/RankBars";
import useElementSize from "../components/charts/useElementSize";
import { EVENT_TYPE_META, VPN_STATUS_META } from "../components/charts/chartColors";
import DatePicker from "../components/DatePicker";
import StackedBar from "../components/reports/StackedBar";
import ReportDetailModal from "../components/reports/ReportDetailModal";

import { cameras } from "../data/cameras";
import {
  generateStatistics,
  generateStatusSummary,
  getDeviceVpnList,
  toDateInputValue,
} from "../data/statisticsMock";

/* 서버 연결 후 주석 해제
import { getStatistics, getStatusSummary, downloadReport } from "../api/reportApi";
*/

const QUICK_RANGES = [
  { key: 7, label: "최근 7일" },
  { key: 30, label: "최근 30일" },
  { key: 90, label: "최근 90일" },
];

function getRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function Reports() {
  // 입력 중인 조건 (조회 버튼을 눌러야 적용)
  const [draft, setDraft] = useState({ ...getRange(7), cameraId: "all", quick: 7 });
  const [applied, setApplied] = useState(draft);

  const [reportFormat, setReportFormat] = useState("csv");

  // 상세 보기 모달 (trend | type | hour | camera | online | vpn)
  const [detailKind, setDetailKind] = useState(null);

  const isRangeInvalid = draft.startDate > draft.endDate;

  /* ---------- 목업 데이터 (서버 연결 후 API 응답으로 교체) ---------- */

  const stats = useMemo(() => generateStatistics(applied), [applied]);
  const statusSummary = useMemo(() => generateStatusSummary(), []);
  const vpnList = useMemo(() => getDeviceVpnList(), []);

  /*
  서버 연결 후 예시
  useEffect(() => {
    getStatistics(applied).then(setStats).catch(console.error);
  }, [applied]);

  useEffect(() => {
    getStatusSummary().then(setStatusSummary).catch(console.error);
  }, []);
  */

  const trendPoints = stats.trend.map((item) => ({
    label: item.date.slice(5).replace("-", "/"),
    value: item.count,
  }));

  const typeData = stats.byType.map((item) => ({
    key: item.type,
    label: EVENT_TYPE_META[item.type].label,
    color: EVENT_TYPE_META[item.type].color,
    value: item.count,
  }));

  const hourData = stats.byHour.map((item) => ({
    label: `${item.hour}시`,
    value: item.count,
  }));

  const dayCount = Math.max(1, stats.trend.length);
  const topType = [...typeData].sort((a, b) => b.value - a.value)[0];
  const peakHour = [...stats.byHour].sort((a, b) => b.count - a.count)[0];

  const selectedCameraName =
    applied.cameraId === "all"
      ? "전체 카메라"
      : cameras.find((c) => String(c.device_id) === String(applied.cameraId))?.name;

  const rangeText = `${applied.startDate} ~ ${applied.endDate} · ${selectedCameraName}`;

  /* ---------- 카드 크기에 맞춘 차트 크기 ---------- */

  const [trendRef, trendSize] = useElementSize();
  const [hourRef, hourSize] = useElementSize();
  const [typeRef, typeSize] = useElementSize();
  const [rankRef, rankSize] = useElementSize();

  // 순위는 카드 높이에 들어가는 만큼만 (전체는 상세 보기에서)
  const RANK_ROW_HEIGHT = 40;
  const rankCount = Math.max(3, Math.floor(rankSize.height / RANK_ROW_HEIGHT));

  const rankData = stats.byCamera.slice(0, rankCount).map((item) => ({
    key: item.cameraId,
    label: item.cameraName,
    sub: item.location,
    value: item.count,
  }));

  // 도넛은 카드 높이에 맞춰 (범례는 옆에)
  const donutSize = Math.max(110, Math.min(190, typeSize.height - 8));

  /* ---------- 조건 ---------- */

  function handleQuickRange(days) {
    setDraft((prev) => ({ ...prev, ...getRange(days), quick: days }));
  }

  function handleDraftChange(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value, quick: key === "cameraId" ? prev.quick : null }));
  }

  function handleApply() {
    if (isRangeInvalid) return;
    setApplied(draft);
  }

  /* ---------- 리포트 다운로드 (WEB-F-043) ---------- */

  function handleDownload() {
    if (reportFormat === "pdf") {
      // 시연용: 브라우저 인쇄 → PDF 저장
      window.print();
      return;
    }

    const rows = [
      ["SECURE CAM 이벤트 통계 리포트"],
      ["조회 기간", `${applied.startDate} ~ ${applied.endDate}`],
      ["카메라", selectedCameraName],
      ["전체 이벤트", stats.total],
      [],
      ["[기간별 발생 추이]"],
      ["날짜", "건수"],
      ...stats.trend.map((t) => [t.date, t.count]),
      [],
      ["[유형별 통계]"],
      ["유형", "건수"],
      ...typeData.map((t) => [t.label, t.value]),
      [],
      ["[카메라별 순위]"],
      ["순위", "카메라", "위치", "건수"],
      ...stats.byCamera.map((c, i) => [i + 1, c.cameraName, c.location, c.count]),
      [],
      ["[시간대별 통계]"],
      ["시간", "건수"],
      ...stats.byHour.map((h) => [`${h.hour}시`, h.count]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    // 엑셀 한글 깨짐 방지용 BOM
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    saveBlob(blob, `report_${applied.startDate}_${applied.endDate}.csv`);

    /* 서버 연결 후
    const blob = await downloadReport({ ...applied, format: reportFormat });
    saveBlob(blob, `report_${applied.startDate}_${applied.endDate}.${reportFormat}`);
    */
  }

  const onlineRatio = (statusSummary.onlineCameras / statusSummary.totalCameras) * 100;

  /* ---------- 요약 타일 ---------- */

  const kpis = [
    {
      key: "total",
      detail: "trend",
      icon: <FiActivity />,
      label: "전체 이벤트",
      value: stats.total.toLocaleString(),
      unit: "건",
    },
    {
      key: "avg",
      detail: "trend",
      icon: <FiBarChart2 />,
      label: "일 평균",
      value: (stats.total / dayCount).toFixed(1),
      unit: "건",
    },
    {
      key: "topType",
      detail: "type",
      icon: <FiTag />,
      label: "최다 유형",
      value: topType?.label ?? "-",
      text: true,
    },
    {
      key: "peakHour",
      detail: "hour",
      icon: <FiClock />,
      label: "최다 시간대",
      value: peakHour ? `${peakHour.hour}시 ~ ${peakHour.hour + 1}시` : "-",
      text: true,
    },
    {
      key: "online",
      detail: "online",
      icon: <FiWifi />,
      label: `카메라 온라인 · 전체 ${statusSummary.totalCameras}대`,
      value: `${onlineRatio.toFixed(0)}%`,
      bar: [
        { key: "online", label: "온라인", value: statusSummary.onlineCameras, color: "var(--success)" },
        { key: "offline", label: "오프라인", value: statusSummary.offlineCameras, color: "var(--danger)" },
      ],
    },
    {
      key: "vpn",
      detail: "vpn",
      icon: <FiShield />,
      label: `VPN 오류 기기 · 전체 ${statusSummary.totalCameras}대`,
      value: statusSummary.vpnError,
      unit: "대",
      bar: [
        { key: "connected", ...VPN_STATUS_META.connected, value: statusSummary.vpnConnected },
        { key: "disconnected", ...VPN_STATUS_META.disconnected, value: statusSummary.vpnDisconnected },
        { key: "error", ...VPN_STATUS_META.error, value: statusSummary.vpnError },
      ],
    },
  ];

  return (
    <main className="reports-page">

      {/* WEB-F-042 조회 조건 */}
      <section className="report-filter">
        <div className="report-quick">
          {QUICK_RANGES.map((range) => (
            <button
              type="button"
              key={range.key}
              className={draft.quick === range.key ? "active" : ""}
              onClick={() => handleQuickRange(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="report-dates">
          <DatePicker
            value={draft.startDate}
            max={draft.endDate}
            placeholder="시작일"
            onChange={(value) => value && handleDraftChange("startDate", value)}
          />
          <span>~</span>
          <DatePicker
            value={draft.endDate}
            min={draft.startDate}
            max={toDateInputValue(new Date())}
            placeholder="종료일"
            onChange={(value) => value && handleDraftChange("endDate", value)}
          />
        </div>

        <select
          className="field-select"
          value={draft.cameraId}
          onChange={(e) => handleDraftChange("cameraId", e.target.value)}
          aria-label="카메라 선택"
        >
          <option value="all">전체 카메라</option>
          {cameras.map((camera) => (
            <option key={camera.device_id} value={camera.device_id}>
              {camera.name}
            </option>
          ))}
        </select>

        <button type="button" className="btn primary" onClick={handleApply} disabled={isRangeInvalid}>
          <FiSearch />
          조회
        </button>

        <span className="report-caption">
          {rangeText}
          {isRangeInvalid && <span className="report-error"> · 시작일이 종료일보다 늦습니다.</span>}
        </span>

        <div className="report-download">
          <select
            className="field-select"
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value)}
            aria-label="리포트 형식"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF (인쇄)</option>
          </select>

          <button type="button" className="btn" onClick={handleDownload}>
            {reportFormat === "pdf" ? <FiPrinter /> : <FiDownload />}
            리포트 다운로드
          </button>
        </div>
      </section>


      {/* WEB-F-041 상태 요약 + 핵심 수치 (누르면 상세 보기) */}
      <section className="report-kpi-row">
        {kpis.map((kpi) => (
          <button
            type="button"
            key={kpi.key}
            className={`report-kpi ${kpi.key}`}
            onClick={() => setDetailKind(kpi.detail)}
          >
            <span className="report-kpi-icon">{kpi.icon}</span>

            <span className="report-kpi-text">
              <span className="report-kpi-label">{kpi.label}</span>
              <strong className={kpi.text ? "text" : ""}>
                {kpi.value}
                {kpi.unit && <small>{kpi.unit}</small>}
              </strong>
              {kpi.bar && <StackedBar items={kpi.bar} showLegend={false} compact />}
            </span>
          </button>
        ))}
      </section>


      {/* WEB-F-040 통계 시각화 (카드를 누르면 상세 보기) */}
      <section className="report-main">
        <ReportCard
          className="trend"
          icon={<FiTrendingUp />}
          title="기간별 이벤트 발생 추이"
          onOpen={() => setDetailKind("trend")}
        >
          <div className="report-chart-body" ref={trendRef}>
            <LineChart points={trendPoints} height={Math.max(120, trendSize.height - 4)} />
          </div>
        </ReportCard>

        <ReportCard
          className="type"
          icon={<FiPieChart />}
          title="이벤트 유형별 통계"
          onOpen={() => setDetailKind("type")}
        >
          <div className="report-chart-body" ref={typeRef}>
            <DonutChart
              data={typeData}
              size={donutSize}
              thickness={Math.round(donutSize / 8)}
              centerLabel="전체 이벤트"
            />
          </div>
        </ReportCard>

        <ReportCard
          className="hour"
          icon={<FiClock />}
          title="시간대별 이벤트 발생"
          onOpen={() => setDetailKind("hour")}
        >
          <div className="report-chart-body" ref={hourRef}>
            <BarChart data={hourData} labelEvery={3} height={Math.max(120, hourSize.height - 4)} />
          </div>
        </ReportCard>

        <ReportCard
          className="camera"
          icon={<FiAward />}
          title="카메라별 이벤트 순위"
          meta={`상위 ${rankData.length}대`}
          onOpen={() => setDetailKind("camera")}
        >
          <div className="report-chart-body" ref={rankRef}>
            <RankBars data={rankData} />
          </div>
        </ReportCard>
      </section>


      {detailKind && (
        <ReportDetailModal
          kind={detailKind}
          onClose={() => setDetailKind(null)}
          data={{
            stats,
            trendPoints,
            typeData,
            hourData,
            dayCount,
            statusSummary,
            cameraList: cameras,
            vpnList,
            rangeText,
          }}
        />
      )}

    </main>
  );
}


// 통계 카드 (어디를 눌러도 상세 보기)
function ReportCard({ className = "", icon, title, meta, onOpen, children }) {
  return (
    <article
      className={`report-card clickable ${className}`.trim()}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${title} 자세히 보기`}
    >
      <div className="report-card-header">
        <h3>
          {icon}
          {title}
        </h3>

        {meta && <span className="report-card-meta">{meta}</span>}

        <span className="report-card-open">
          <FiMaximize2 />
          자세히
        </span>
      </div>

      {children}
    </article>
  );
}


function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export default Reports;

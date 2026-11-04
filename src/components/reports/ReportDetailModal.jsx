// 통계 카드를 눌렀을 때 뜨는 상세 보기 (실시간 모니터링 프라이버시 존 설정과 같은 공통 모달)
import { useNavigate } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

import Modal from "../Modal";
import "../Modal.css";
import "./ReportDetail.css";

import LineChart from "../charts/LineChart";
import BarChart from "../charts/BarChart";
import DonutChart from "../charts/DonutChart";
import RankBars from "../charts/RankBars";
import { VPN_STATUS_META } from "../charts/chartColors";
import StackedBar from "./StackedBar";
import { formatLastSeen, formatUptime } from "../../utils/formatDateTime";

const TITLES = {
  trend: "기간별 이벤트 발생 추이",
  type: "이벤트 유형별 통계",
  hour: "시간대별 이벤트 발생",
  camera: "카메라별 이벤트 순위",
  online: "카메라 온라인 상태",
  vpn: "Device VPN 연결 상태",
};

// 시간대 구간 (시작 시 ~ 끝 시 전)
const HOUR_BLOCKS = [
  { label: "새벽", range: "00 ~ 06시", from: 0, to: 6 },
  { label: "오전", range: "06 ~ 12시", from: 6, to: 12 },
  { label: "오후", range: "12 ~ 18시", from: 12, to: 18 },
  { label: "저녁 · 밤", range: "18 ~ 24시", from: 18, to: 24 },
];

function percent(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
}

function ReportDetailModal({ kind, onClose, data }) {
  return (
    <Modal title={TITLES[kind]} onClose={onClose} width={900}>
      <p className="report-detail-range">{data.rangeText}</p>

      {kind === "trend" && <TrendDetail data={data} />}
      {kind === "type" && <TypeDetail data={data} />}
      {kind === "hour" && <HourDetail data={data} />}
      {kind === "camera" && <CameraDetail data={data} onClose={onClose} />}
      {kind === "online" && <OnlineDetail data={data} onClose={onClose} />}
      {kind === "vpn" && <VpnDetail data={data} />}
    </Modal>
  );
}


/* ---------- 기간별 추이 ---------- */

function TrendDetail({ data }) {
  const { stats, trendPoints, dayCount } = data;

  const average = stats.total / dayCount;
  const sorted = [...stats.trend].sort((a, b) => b.count - a.count);
  const maxDay = sorted[0];
  const minDay = sorted[sorted.length - 1];

  return (
    <>
      <div className="report-detail-kpis">
        <Kpi label="전체 이벤트" value={stats.total.toLocaleString()} unit="건" />
        <Kpi label="일 평균" value={average.toFixed(1)} unit="건" />
        <Kpi label="가장 많은 날" value={maxDay?.count ?? "-"} unit="건" sub={maxDay?.date} />
        <Kpi label="가장 적은 날" value={minDay?.count ?? "-"} unit="건" sub={minDay?.date} />
      </div>

      <div className="report-detail-chart">
        <LineChart points={trendPoints} height={280} />
      </div>

      <table className="report-detail-table">
        <thead>
          <tr>
            <th>날짜</th>
            <th>건수</th>
            <th>평균 대비</th>
          </tr>
        </thead>
        <tbody>
          {[...stats.trend].reverse().map((item) => {
            const diff = average > 0 ? ((item.count - average) / average) * 100 : 0;

            return (
              <tr key={item.date}>
                <td>{item.date}</td>
                <td>{item.count}건</td>
                <td className={diff >= 0 ? "up" : "down"}>
                  {diff >= 0 ? "+" : ""}
                  {diff.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}


/* ---------- 유형별 ---------- */

function TypeDetail({ data }) {
  const { stats, typeData, dayCount } = data;
  const sorted = [...typeData].sort((a, b) => b.value - a.value);

  return (
    <div className="report-detail-split">
      <DonutChart data={typeData} size={220} thickness={26} centerLabel="전체 이벤트" />

      <table className="report-detail-table">
        <thead>
          <tr>
            <th>유형</th>
            <th>건수</th>
            <th>비율</th>
            <th>일 평균</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.key}>
              <td>
                <span className="legend-swatch" style={{ backgroundColor: item.color }} />
                {item.label}
              </td>
              <td>{item.value}건</td>
              <td>{percent(item.value, stats.total)}%</td>
              <td>{(item.value / dayCount).toFixed(1)}건</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* ---------- 시간대별 ---------- */

function HourDetail({ data }) {
  const { stats, hourData } = data;

  const topHours = [...stats.byHour].sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <>
      <div className="report-detail-kpis">
        {HOUR_BLOCKS.map((block) => {
          const count = stats.byHour
            .filter((item) => item.hour >= block.from && item.hour < block.to)
            .reduce((sum, item) => sum + item.count, 0);

          return (
            <Kpi
              key={block.label}
              label={`${block.label} (${block.range})`}
              value={count}
              unit="건"
              sub={`${percent(count, stats.total)}%`}
            />
          );
        })}
      </div>

      <div className="report-detail-chart">
        <BarChart data={hourData} height={260} labelEvery={2} />
      </div>

      <div className="report-detail-top">
        <span>가장 많이 발생한 시간대</span>
        {topHours.map((item, index) => (
          <strong key={item.hour}>
            {index + 1}. {item.hour}시 ~ {item.hour + 1}시 · {item.count}건
          </strong>
        ))}
      </div>
    </>
  );
}


/* ---------- 카메라별 순위 ---------- */

function CameraDetail({ data, onClose }) {
  const navigate = useNavigate();
  const { stats } = data;

  const rankData = stats.byCamera.map((item) => ({
    key: item.cameraId,
    label: item.cameraName,
    sub: item.location,
    value: item.count,
  }));

  return (
    <>
      <p className="report-detail-hint">
        카메라를 누르면 실시간 모니터링 화면으로 이동합니다.
      </p>

      <div className="report-detail-rank">
        <RankBars
          data={rankData}
          onSelect={(item) => {
            onClose();
            navigate(`/Monitoring/${item.key}`);
          }}
        />
      </div>
    </>
  );
}


/* ---------- 카메라 온라인 ---------- */

function OnlineDetail({ data, onClose }) {
  const navigate = useNavigate();
  const { statusSummary, cameraList } = data;

  const groups = [
    { key: "online", label: "온라인", color: "var(--success)" },
    { key: "offline", label: "오프라인", color: "var(--danger)" },
  ];

  return (
    <>
      <StackedBar
        items={groups.map((group) => ({
          ...group,
          value: group.key === "online" ? statusSummary.onlineCameras : statusSummary.offlineCameras,
        }))}
      />

      <div className="report-detail-columns">
        {groups.map((group) => (
          <section key={group.key}>
            <h4 style={{ color: group.color }}>{group.label}</h4>
            <ul className="report-detail-list">
              {cameraList
                .filter((camera) => camera.status === group.key)
                .map((camera) => (
                  <li key={camera.device_id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/Monitoring/${camera.device_id}`);
                      }}
                    >
                      <span className="report-detail-name">
                        {camera.name}
                        <small>{camera.location}</small>
                      </span>
                      <small>
                        {group.key === "online"
                          ? `가동 ${formatUptime(camera.uptime_seconds)}`
                          : `마지막 수신 ${formatLastSeen(camera.last_seen)}`}
                      </small>
                      <FiChevronRight />
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}


/* ---------- Device VPN ---------- */

function VpnDetail({ data }) {
  const { vpnList } = data;

  const groups = Object.entries(VPN_STATUS_META).map(([key, meta]) => ({
    key,
    ...meta,
    devices: vpnList.filter((device) => device.vpnStatus === key),
  }));

  return (
    <>
      <StackedBar
        items={groups.map((group) => ({
          key: group.key,
          label: group.label,
          color: group.color,
          value: group.devices.length,
        }))}
      />

      <div className="report-detail-columns three">
        {groups.map((group) => (
          <section key={group.key}>
            <h4 style={{ color: group.color }}>
              {group.label} · {group.devices.length}대
            </h4>
            <ul className="report-detail-list">
              {group.devices.map((device) => (
                <li key={device.cameraId}>
                  <div>
                    <span className="report-detail-name">
                      {device.cameraName}
                      <small>{device.location}</small>
                    </span>
                    {device.error && <small className="report-detail-error">{device.error}</small>}
                  </div>
                </li>
              ))}
              {group.devices.length === 0 && (
                <li className="report-detail-empty">해당 기기가 없습니다.</li>
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}


function Kpi({ label, value, unit, sub }) {
  return (
    <div className="report-detail-kpi">
      <span>{label}</span>
      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
      {sub && <em>{sub}</em>}
    </div>
  );
}

export default ReportDetailModal;

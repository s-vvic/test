import { useState } from "react";
import Toggle from "../../components/Toggle";
import { CATEGORY_COLORS } from "../../components/charts/chartColors";
import { initialStorageSettings } from "../../data/subscriptionMock";
// import { getStorageSettings, updateStorageSettings } from "../../api/settingsApi";  // 서버 연결 후 주석 해제
import "./Settings.css";
import "../../components/Modal.css";
import "../../components/settings/SettingsExtra.css";

const QUALITY_OPTIONS = [
  { value: "low", label: "저화질 (480p)", gbPerDay: 0.6 },
  { value: "medium", label: "중화질 (720p)", gbPerDay: 1.4 },
  { value: "high", label: "고화질 (1080p)", gbPerDay: 3.1 },
];

const RETENTION_OPTIONS = [7, 14, 30, 60, 90];

// 저장소 설정 (WEB-F-063)
function StorageSettings() {
  const [saved, setSaved] = useState(initialStorageSettings);
  const [settings, setSettings] = useState(initialStorageSettings);
  const [saveState, setSaveState] = useState("idle");

  /* 서버 연결 후
  useEffect(() => {
    getStorageSettings()
      .then((data) => {
        // 명세에 없는 항목(saveMode, overwriteWhenFull, usage.byType)은 화면 값을 유지한다
        const merged = { ...initialStorageSettings, ...data, usage: { ...initialStorageSettings.usage, ...data.usage } };
        setSaved(merged);
        setSettings(merged);
      })
      .catch(console.error);
  }, []);
  */

  const { usage } = settings;
  const usedRatio = (usage.usedGb / usage.totalGb) * 100;
  const remainGb = usage.totalGb - usage.usedGb;

  const isDirty = JSON.stringify({ ...settings, usage: null }) !== JSON.stringify({ ...saved, usage: null });

  // 선택한 화질 / 보관 기간 기준 카메라 1대 예상 사용량
  const quality = QUALITY_OPTIONS.find((q) => q.value === settings.quality);
  const estimatePerCamera =
    quality.gbPerDay * settings.retentionDays * (settings.saveMode === "event" ? 0.25 : 1);

  function update(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
  }

  function handleSave() {
    setSaveState("saving");

    setTimeout(() => {
      setSaved(settings);
      setSaveState("done");
    }, 600);

    /* 서버 연결 후
    try {
      const data = await updateStorageSettings({
        autoSave: settings.autoSave,
        quality: settings.quality,
        retentionDays: settings.retentionDays,
      });
      const merged = { ...settings, ...data, usage: { ...settings.usage, ...data.usage } };
      setSaved(merged);
      setSettings(merged);
      setSaveState("done");
    } catch (error) {
      console.error(error);
      setSaveState("idle");
    }
    */
  }

  return (
    <div className="settings-section">
      <h2>저장소 설정</h2>

      {/* 사용량 */}
      <div className="storage-usage">
        <div className="storage-usage-head">
          <div>
            <strong>{usage.usedGb.toFixed(1)} GB</strong>
            <span> / {usage.totalGb} GB 사용 중</span>
          </div>
          <span className={usedRatio >= 90 ? "storage-warn" : ""}>
            남은 용량 {remainGb.toFixed(1)} GB ({(100 - usedRatio).toFixed(0)}%)
          </span>
        </div>

        <div className="storage-track">
          {usage.byType.map((item, index) => (
            <div
              key={item.key}
              className="storage-segment"
              style={{
                width: `${(item.gb / usage.totalGb) * 100}%`,
                backgroundColor: CATEGORY_COLORS[index],
              }}
              title={`${item.label} ${item.gb} GB`}
            />
          ))}
        </div>

        <ul className="storage-legend">
          {usage.byType.map((item, index) => (
            <li key={item.key}>
              <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[index] }} />
              {item.label}
              <strong>{item.gb} GB</strong>
            </li>
          ))}
          <li>
            <span className="legend-dot empty" />
            남은 용량
            <strong>{remainGb.toFixed(1)} GB</strong>
          </li>
        </ul>
      </div>


      <div className="setting-card">
        <div>
          <strong>영상 자동 저장</strong>
          <p>카메라 영상을 클라우드 저장소에 자동으로 저장합니다.</p>
        </div>
        <Toggle checked={settings.autoSave} onChange={() => update("autoSave", !settings.autoSave)} />
      </div>

      <div className={`setting-card ${settings.autoSave ? "" : "setting-disabled"}`}>
        <div>
          <strong>저장 방식</strong>
          <p>이벤트 발생 시에만 저장하거나 상시 녹화합니다.</p>
        </div>
        <select
          value={settings.saveMode}
          disabled={!settings.autoSave}
          onChange={(e) => update("saveMode", e.target.value)}
        >
          <option value="event">이벤트 발생 시</option>
          <option value="continuous">상시 녹화</option>
        </select>
      </div>

      <div className={`setting-card ${settings.autoSave ? "" : "setting-disabled"}`}>
        <div>
          <strong>저장 화질</strong>
          <p>화질이 높을수록 저장 공간을 많이 사용합니다.</p>
        </div>
        <select
          value={settings.quality}
          disabled={!settings.autoSave}
          onChange={(e) => update("quality", e.target.value)}
        >
          {QUALITY_OPTIONS.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`setting-card ${settings.autoSave ? "" : "setting-disabled"}`}>
        <div>
          <strong>보관 기간</strong>
          <p>보관 기간이 지난 영상은 자동으로 삭제됩니다.</p>
        </div>
        <select
          value={settings.retentionDays}
          disabled={!settings.autoSave}
          onChange={(e) => update("retentionDays", Number(e.target.value))}
        >
          {RETENTION_OPTIONS.map((days) => (
            <option key={days} value={days}>
              {days}일
            </option>
          ))}
        </select>
      </div>

      <div className="setting-card">
        <div>
          <strong>용량 부족 시 덮어쓰기</strong>
          <p>저장 공간이 가득 차면 가장 오래된 영상부터 삭제합니다.</p>
        </div>
        <Toggle
          checked={settings.overwriteWhenFull}
          onChange={() => update("overwriteWhenFull", !settings.overwriteWhenFull)}
        />
      </div>

      <div className="storage-footer">
        <span>
          예상 사용량: 카메라 1대당 약 <strong>{estimatePerCamera.toFixed(1)} GB</strong>
          {" "}({quality.label}, {settings.retentionDays}일)
        </span>

        <button
          type="button"
          className="btn primary"
          onClick={handleSave}
          disabled={!isDirty || saveState === "saving"}
        >
          {saveState === "saving" ? "저장 중..." : saveState === "done" && !isDirty ? "저장됨" : "변경 사항 저장"}
        </button>
      </div>
    </div>
  );
}

export default StorageSettings;

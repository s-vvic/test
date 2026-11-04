import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivacyZoneEditor from "../../components/privacy/PrivacyZoneEditor";
import { cameras } from "../../data/cameras";
import { getZones, saveZones, countZones } from "../../data/privacyZoneStore";
// import { getPrivacyZones, savePrivacyZones } from "../../api/privacyZoneApi";  // 서버 연결 후 주석 해제
import "./Settings.css";
import "../../components/Modal.css";
import "../../components/settings/SettingsExtra.css";

// 프라이버시 존 관리 (WEB-F-064)
function PrivacyZoneSettings() {
  const navigate = useNavigate();

  const [cameraId, setCameraId] = useState(cameras[0]?.device_id);
  const [zones, setZones] = useState(() => getZones(cameras[0]?.device_id));
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(getZones(cameras[0]?.device_id)));
  const [keyword, setKeyword] = useState("");
  const [saveState, setSaveState] = useState("idle"); // idle | saving | done | failed
  const [, forceRender] = useState(0);

  const isDirty = JSON.stringify(zones) !== savedJson;

  const camera = cameras.find((c) => c.device_id === cameraId);

  const filteredCameras = cameras.filter((c) =>
    c.name.toLowerCase().includes(keyword.toLowerCase())
  );

  function handleSelectCamera(id) {
    if (id === cameraId) return;

    if (isDirty && !window.confirm("저장하지 않은 변경 사항이 있습니다. 이동하시겠습니까?")) {
      return;
    }

    const next = getZones(id);

    setCameraId(id);
    setZones(next);
    setSavedJson(JSON.stringify(next));
    setSaveState("idle");
  }

  function handleSave() {
    setSaveState("saving");

    // 시연용: 서버 → 보드 적용 결과 대기
    // 오프라인 카메라는 보드에 적용할 수 없으므로 실패 처리
    setTimeout(() => {
      if (camera.status !== "online") {
        setSaveState("failed");
        return;
      }

      const saved = saveZones(cameraId, zones);

      setSavedJson(JSON.stringify(saved));
      setSaveState("done");
      forceRender((n) => n + 1);
    }, 900);

    /* 서버 연결 후
    try {
      const result = await savePrivacyZones(cameraId, zones);
      if (!result.applied) {
        setSaveState("failed");
        return;
      }
      setZones(result.zones);
      setSavedJson(JSON.stringify(result.zones));
      setSaveState("done");
    } catch (error) {
      console.error(error);
      setSaveState("failed");
    }
    */
  }

  return (
    <div className="settings-section pz-settings-page">
      <h2>프라이버시 존 관리</h2>

      <div className="pz-settings">
        <aside className="pz-camera-list">
          <input
            className="field-input"
            placeholder="카메라 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <ul>
            {filteredCameras.map((c) => (
              <li key={c.device_id}>
                <button
                  type="button"
                  className={c.device_id === cameraId ? "active" : ""}
                  onClick={() => handleSelectCamera(c.device_id)}
                >
                  <span className={`pz-camera-dot ${c.status}`} />
                  <span className="pz-camera-name">{c.name}</span>
                  {countZones(c.device_id) > 0 && <span className="pz-camera-count">{countZones(c.device_id)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="pz-settings-main">
          {camera && (
            <>
              <div className="pz-settings-head">
                <div>
                  <strong>{camera.name}</strong>
                  <span>
                    {camera.location} · {camera.status === "online" ? "온라인" : "오프라인"}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn small"
                  onClick={() => navigate(`/Monitoring/${camera.device_id}`)}
                >
                  실시간 화면 보기
                </button>
              </div>

              <PrivacyZoneEditor
                key={camera.device_id}
                zones={zones}
                onChange={(next) => {
                  setZones(next);
                  setSaveState("idle");
                }}
                cameraName={camera.name}
              />

              <div className="pz-settings-footer">
                <span className={`pz-save-message ${saveState}`}>
                  {saveState === "done" && "보드에 프라이버시 존이 적용되었습니다."}
                  {saveState === "failed" && "보드 적용에 실패했습니다. 카메라 연결 상태를 확인하세요."}
                  {saveState === "idle" && isDirty && "저장하지 않은 변경 사항이 있습니다."}
                </span>

                <button
                  type="button"
                  className="btn"
                  disabled={!isDirty || saveState === "saving"}
                  onClick={() => {
                    setZones(JSON.parse(savedJson));
                    setSaveState("idle");
                  }}
                >
                  되돌리기
                </button>

                <button
                  type="button"
                  className="btn primary"
                  disabled={!isDirty || saveState === "saving"}
                  onClick={handleSave}
                >
                  {saveState === "saving" ? "보드에 적용 중..." : "저장"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default PrivacyZoneSettings;

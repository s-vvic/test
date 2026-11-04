import { useState } from "react";
import Modal from "../Modal";
import "../Modal.css";
import PrivacyZoneEditor from "./PrivacyZoneEditor";
import { getZones, saveZones } from "../../data/privacyZoneStore";
// import { getPrivacyZones, savePrivacyZones } from "../../api/privacyZoneApi";  // 서버 연결 후 주석 해제

// 실시간 모니터링 화면의 프라이버시 존 설정 (WEB-F-024)
function PrivacyZoneModal({ camera, onClose, onSaved }) {
  const [zones, setZones] = useState(() => getZones(camera.device_id));
  const [saveState, setSaveState] = useState("idle"); // idle | saving | done

  /* 서버 연결 후
  useEffect(() => {
    getPrivacyZones(camera.mac).then(setZones).catch(console.error);
  }, [camera.device_id, camera.mac]);
  */

  function handleSave() {
    setSaveState("saving");

    // 시연용: 서버 → 보드 적용 대기 흉내
    setTimeout(() => {
      const saved = saveZones(camera.device_id, zones);

      setSaveState("done");
      onSaved?.(saved);

      setTimeout(onClose, 700);
    }, 900);

    /* 서버 연결 후
    try {
      const result = await savePrivacyZones(camera.mac, zones);
      if (!result.applied) throw new Error("보드 적용 실패");
      onSaved?.(result.zones);
      onClose();
    } catch (error) {
      console.error(error);
      setSaveState("idle");
    }
    */
  }

  return (
    <Modal
      title={`프라이버시 존 설정 · ${camera.name}`}
      width={980}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={saveState !== "idle"}
          >
            {saveState === "saving" && "보드에 적용 중..."}
            {saveState === "done" && "적용 완료"}
            {saveState === "idle" && "저장"}
          </button>
        </>
      }
    >
      <PrivacyZoneEditor zones={zones} onChange={setZones} cameraName={camera.name} />
    </Modal>
  );
}

export default PrivacyZoneModal;

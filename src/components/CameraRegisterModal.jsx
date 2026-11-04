import { useState } from "react";
import { FiX, FiCpu, FiTag, FiMapPin, FiVideo } from "react-icons/fi";

import "./CameraRegisterModal.css";
import { normalizeMac } from "../utils/mac";

const CAMERA_NAME_PATTERN = /^[가-힣a-zA-Z0-9 _()-]*$/;

const MAC_PATTERN = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

// 화면에서는 입력값을 AA:BB:CC:DD:EE:FF 형식으로 보여 준다 (구분자 -, : , 공백 모두 허용)
// 서버에는 콜론 없는 12자리(AABBCCDDEEFF)로 보낸다
function formatMacAddress(value) {
  const hex = value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 12);

  return hex.match(/.{1,2}/g)?.join(":") ?? "";
}


function CameraRegisterModal({ onClose, onRegister, registeredMacs = [] }) {
  const [ macAddress, setMacAddress ] = useState("");
  const [ cameraName, setCameraName ] = useState("");
  const [ location, setLocation ] = useState("");

  const [ errorMessage, setErrorMessage ] = useState("");
  const [ submitted, setSubmitted ] = useState(false);
  const [ cameraNameError, setCameraNameError ] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setSubmitted(true);

    const isMacEmpty = !macAddress;
    const isNameEmpty = !cameraName.trim();

    if (isMacEmpty || isNameEmpty) {
      setErrorMessage("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!MAC_PATTERN.test(macAddress)) {
      setErrorMessage("MAC 주소 형식이 올바르지 않습니다. (예: A4:5E:60:1C:00:01)");
      return;
    }

    // 등록된 MAC(서버 형식)과 비교할 때는 둘 다 콜론 없는 형식으로 맞춘다
    if (registeredMacs.map(normalizeMac).includes(normalizeMac(macAddress))) {
      setErrorMessage("이미 등록된 MAC 주소입니다.");
      return;
    }

    if (!CAMERA_NAME_PATTERN.test(cameraName.trim())) {
      setErrorMessage(
        "카메라 이름은 한글, 영문, 숫자, 공백, -, _, (, )만 사용할 수 있습니다."
      );
      return;
    }

    setErrorMessage("");

    const newCamera = {
      mac: normalizeMac(macAddress),
      name: cameraName.trim(),
      location: location.trim() || "미설정",
    };

    onRegister(newCamera);
  }

  return (
    <div 
      className="register-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="register-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="register-modal-header">
          <div>
            <h2>
              <span className="register-title-icon">
                <FiVideo />
              </span>
              카메라 등록
            </h2>
            <p>카메라 보드의 MAC 주소로 계정에 등록합니다.</p>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <div className="register-field">
            <label htmlFor="register-mac">
              <FiCpu className="register-label-icon" />
              MAC 주소
              <span className="required-mark">*</span>
            </label>
            <input
              id="register-mac"
              type="text"
              className={`mac-input ${
                submitted && !MAC_PATTERN.test(macAddress)
                  ? "input-error"
                  : ""
              }`.trim()}
              placeholder="AA:BB:CC:DD:EE:FF"
              value={macAddress}
              maxLength={17}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setMacAddress(formatMacAddress(event.target.value));
                setErrorMessage("");
              }}
            />
            <p className="field-hint">
              보드 뒷면 라벨에 적힌 12자리 값을 입력하세요. 구분자(:)는 자동으로 입력됩니다.
            </p>
          </div>

          <div className="register-devider" />

          <div className="register-field">
            <label>
              <FiTag className="register-label-icon" />
              카메라 이름
              <span className="required-mark">*</span>
            </label>
            <div className="camera-name-input-wrapper">
              <input
                type="text"
                placeholder="예: CAM-01 (출입구)"
                maxLength={15}
                value={cameraName}
                className={
                  (submitted && !cameraName.trim()) || cameraNameError
                    ? "input-error"
                    : ""
                }
                onChange={(event) => {
                  const value = event.target.value;

                  setCameraName(value);
                  setErrorMessage("");

                  if (!CAMERA_NAME_PATTERN.test(value)) {
                    setCameraNameError(
                      "한글, 영문, 숫자, 공백, -, _, (, )만 사용할 수 있습니다."
                    );
                  } else {
                    setCameraNameError("");
                  }
                }}
              />

              <span className={`input-character-count ${
                  cameraName.length === 15 ? "limit" : ""
                }`}
              >
                {String(cameraName.length).padStart(2, "0")}/15
              </span>
            </div>
            {cameraNameError && (
              <p className="field-error-message">
                {cameraNameError}
              </p>
            )}
          </div>

          <div className="register-field">
            <label>
              <FiMapPin className="register-label-icon" />
              설치 위치
            </label>
            <div className="camera-location-input-wrapper">
              <input
                type="text"
                placeholder="예: 1층 출입구"
                maxLength={30}
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
              />
              <span className={`input-character-count ${
                  location.length === 30 ? "limit" : ""
                }`}
              >
                {String(location.length).padStart(2, "0")}/30
              </span>
            </div>  
          </div>

          {errorMessage && (
            <p className="register-error-message">
              {errorMessage}
            </p>
          )}

          <div className="register-modal-actions">
            <button
              type="button"
              className="cancel-register-button"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="confirm-register-button"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CameraRegisterModal;

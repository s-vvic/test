import "./DeviceManage.css";
import { useState } from "react";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiVideo,
  FiMapPin,
  FiActivity,
  FiSliders,
  FiWifi,
  FiWifiOff,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";

import EditableCameraName from "../components/EditableCameraName";
import CameraRegisterModal from "../components/CameraRegisterModal";
import CameraSourceBadge from "../components/CameraSourceBadge";
import Pagination from "../components/Pagination";
import useFitPagination from "../hooks/useFitPagination";
import useCameraList from "../hooks/useCameraList";

// import { registerCamera } from "../api/cameraApi";  // 서버 연결 후 주석 해제
import { formatLastSeen } from "../utils/formatDateTime";
import { deviceIdFromMac } from "../utils/mac";

/* 보드 목록 (ICD 2.2.1 GET /devices)
   - 표시 항목: name, location, status(online / offline), last_seen (UTC → KST, null이면 "기록 없음")
   - 목록은 5초마다 자동으로 다시 불러온다 (useCameraList). 서버에 닿지 못하면 목업을 보여 준다
   - 이름 수정 · 삭제 · 등록은 아직 화면에서만 반영된다
     (서버 데이터일 때는 다음 자동 갱신 때 서버 값으로 돌아간다) */

function DeviceManage() {
  const {
    cameras,
    setCameras,
    source,
    fetchedAt,
    isFetching,
    refresh,
  } = useCameraList();
  const [ editingCameraId, setEditingCameraId ] = useState(null);

  const [ isRegisterOpen, setIsRegisterOpen ] = useState(false);

  /* pagination: 화면 높이에 들어가는 만큼만 한 페이지에 표시 */
  const {
    areaRef: tableAreaRef,
    pageItems: currentCameras,
    page: safePage,
    setPage: setCurrentPage,
    totalPages,
    rowsPerPage: camerasPerPage,
  } = useFitPagination(cameras);

  function handlePageChange(page) {
    setCurrentPage(page);
    setEditingCameraId(null);
  }

  function handleCameraNameChange(cameraId, newName) {
    setCameras((prev) =>
    prev.map((camera) =>
      camera.device_id === cameraId
        ? { ...camera, name: newName}
        : camera
      )
    );
    /*
    updateCameraName(camera.mac, newName);  // 2.2.4 보드 정보 수정은 MAC으로 호출
     */
  }

  function handleDeleteCamera(cameraId) {
    setCameras((prev) =>
      prev.filter((camera) => camera.device_id !== cameraId)
    );
  }

  function handleRegisterCamera(newCamera) {
    setCameras((prev) => [
      ...prev,
      {
        // 등록 직후에는 heartbeat를 받기 전이라 offline
        device_id: deviceIdFromMac(newCamera.mac),
        mac: newCamera.mac,
        name: newCamera.name,
        location: newCamera.location,
        status: "offline",
        last_seen: null,
        firmware_version: null,
        vpn_status: null,
        vpn_ip: null,
        latest_event_time: null,
        thumbnail_url: null,
      },
    ]);
    setIsRegisterOpen(false);

    // 새로 등록한 카메라가 보이도록 마지막 페이지로 이동
    setCurrentPage(Math.ceil((cameras.length + 1) / camerasPerPage));
  }

  /*
  async function handleRegiserCamera(cameraData) {
    const response = await registerCamera(cameraData);
    setCameras((prev) => [
      ...prev,
      response,
    ]);
  
    setIsRegisterOpen(false);
  }
  */

  return (
    <main className="device-manage">
      <div className="device-manage-top">
        <h2 className="device-manage-title">
          <span className="device-title-icon">
            <FiVideo />
          </span>
          등록된 카메라
        </h2>
        <div className="device-manage-actions">
          <CameraSourceBadge source={source} fetchedAt={fetchedAt} />

          <button
            type="button"
            className="register-camera-button"
            onClick={refresh}
            disabled={isFetching}
            title="서버에서 보드 목록 다시 불러오기"
          >
            <FiRefreshCw className={isFetching ? "spinning" : ""} />
            새로고침
          </button>

          <button
            className="register-camera-button"
            onClick={() => setIsRegisterOpen(true)}
          >
            <FiPlus />
            카메라 등록
          </button>
        </div>
      </div>

      <div className="device-table-area" ref={tableAreaRef}>
        <div className="device-table-wrapper">
          <table className="device-table">
            {/* 양 끝 빈 열(col-edge)이 남는 폭을 나눠 가져서, 정보 열은 가운데에 모이고 열 사이 간격은 고정된다 */}
            <colgroup>
              <col className="col-edge" />
              <col className="col-name" />
              <col className="col-location" />
              <col className="col-status" />
              <col className="col-last-seen" />
              <col className="col-actions" />
              <col className="col-edge" />
            </colgroup>

            <thead>
              <tr>
                <th className="device-edge" aria-hidden="true" />
                <th><span className="th-label"><FiVideo />카메라 이름</span></th>
                <th><span className="th-label"><FiMapPin />설치 위치</span></th>
                <th><span className="th-label"><FiActivity />상태</span></th>
                <th><span className="th-label"><FiClock />마지막 수신</span></th>
                <th><span className="th-label"><FiSliders />작업</span></th>
                <th className="device-edge" aria-hidden="true" />
              </tr>
            </thead>

            <tbody>
              {currentCameras.length === 0 && (
                <tr>
                  <td colSpan={7} className="device-empty">
                    {source === "loading" ? "불러오는 중..." : "등록된 카메라가 없습니다."}
                  </td>
                </tr>
              )}

              {currentCameras.map((camera) => (
                <tr key={camera.device_id}>
                  <td className="device-edge" aria-hidden="true" />

                  <td>
                    <div className="device-name-cell">
                      <EditableCameraName
                        initialName={camera.name}
                        isEditing={editingCameraId === camera.device_id}
                        onSave={(newName) => {
                          handleCameraNameChange(camera.device_id, newName)
                          setEditingCameraId(null);
                        }}
                        onCancel={() => setEditingCameraId(null)}
                      />
                    </div>
                  </td>

                  <td>
                    <span className={`device-location ${camera.location ? "" : "unset"}`.trim()}>
                      <FiMapPin />
                      {camera.location || "미설정"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`device-status ${camera.status}`}
                    >
                      {camera.status === "online" ? <FiWifi /> : <FiWifiOff />}
                      {camera.status === "online"
                        ? "Online"
                        : "Offline"}
                    </span>
                  </td>

                  <td>
                    <span className={`device-last-seen ${camera.last_seen ? "" : "empty"}`.trim()}>
                      {formatLastSeen(camera.last_seen)}
                    </span>
                  </td>

                  <td>
                    <div className="device-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => setEditingCameraId(camera.device_id)}
                        aria-label="카메라 이름 수정"
                        title="이름 수정"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        className="icon-button delete"
                        onClick={() =>
                          handleDeleteCamera(camera.device_id)
                        }
                        aria-label="카메라 삭제"
                        title="삭제"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>

                  <td className="device-edge" aria-hidden="true" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={cameras.length}
        itemLabel="대"
      />

      {isRegisterOpen && (
        <CameraRegisterModal
          onClose={() => setIsRegisterOpen(false)}
          onRegister={handleRegisterCamera}
          registeredMacs={cameras.map((camera) => camera.mac).filter(Boolean)}
        />
      )}
    </main>
  );
}

export default DeviceManage;
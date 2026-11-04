import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cameras } from "../data/cameras";
import { clearSession } from "../storage/authStorage";
import "./Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [isMonitoringPopoverOpen, setIsMonitoringPopoverOpen] =
    useState(false);

  const menuItems = [
    {
      path: "/dashboard",
      label: "대시보드",
    },
    {
      path: "/multiview",
      label: "다채널 멀티뷰",
    },
    {
      path: "/devices",
      label: "기기 관리",
    },
    {
      path: "/event-logs",
      label: "이벤트 로그",
    },
    {
      path: "/reports",
      label: "통계 및 리포트",
    },
    {
      path: "/vpn-manage",
      label: "VPN 연결 관리"
    },
    {
      path: "/settings",
      label: "설정",
    },
  ];

  const handleMonitoringClick = () => {
    setIsMonitoringPopoverOpen((prev) => !prev);
  };

  const handleCameraSelect = (cameraId) => {
    setIsMonitoringPopoverOpen(false);
    onClose();

    navigate(`/Monitoring/${cameraId}`);
  };

  const handleLogout = () => {
    clearSession();

    setIsMonitoringPopoverOpen(false);
    onClose();

    navigate("/login", { replace: true });
  };

  return (
    <>
      {isOpen && (
        <div
          className="drawer-overlay"
          onClick={() => {
            setIsMonitoringPopoverOpen(false);
            onClose();
          }}
        />
      )}

      <aside
        className={`drawer-sidebar ${
          isOpen ? "drawer-open" : ""
        }`}
      >
        <div className="drawer-header">
          <strong>SECURE CAM</strong>

          <button
            type="button"
            className="drawer-close"
            onClick={() => {
              setIsMonitoringPopoverOpen(false);
              onClose();
            }}
            aria-label="메뉴 닫기"
          >
            ×
          </button>
        </div>

        <nav className="drawer-menu">
          <div className="monitoring-menu-wrapper">
            <button
              type="button"
              className={`drawer-link monitoring-menu-button ${
                isMonitoringPopoverOpen
                  ? "drawer-link-active"
                  : ""
              }`}
              onClick={handleMonitoringClick}
            >
              <span>실시간 모니터링</span>

              <span className="monitoring-arrow">
                {isMonitoringPopoverOpen ? "◀" : "▶"}
              </span>
            </button>

            {isMonitoringPopoverOpen && (
              <div className="camera-popover">
                <div className="camera-popover-header">
                  카메라 선택
                </div>

                <div className="camera-popover-list">
                  {cameras.length === 0 ? (
                    <p className="camera-empty">
                      등록된 카메라가 없습니다.
                    </p>
                  ) : (
                    cameras.map((camera) => (
                      <button
                        key={camera.device_id}
                        type="button"
                        className="camera-popover-item"
                        onClick={() =>
                          handleCameraSelect(camera.device_id)
                        }
                      >
                        <span>{camera.name}</span>

                        <span
                          className={`camera-popover-status ${
                            camera.status === "online"
                              ? "online"
                              : "offline"
                          }`}
                        >
                          {camera.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {menuItems.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              onClick={() => {
                setIsMonitoringPopoverOpen(false);
                onClose();
              }}
              className={({ isActive }) =>
                isActive
                  ? "drawer-link drawer-link-active"
                  : "drawer-link"
              }
            >
              {menu.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="drawer-logout"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
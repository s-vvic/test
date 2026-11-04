import { useState, useRef, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import VpnAlertBanner from "../components/vpn/VpnAlertBanner";
import ApiErrorToast from "../components/ApiErrorToast";
import recentNotifications from "../data/recentNotifications.js";
// import { logout } from "../api/authApi";  // 백엔드 연결 시 주석 해제
import { clearSession } from "../storage/authStorage";
import "./MainLayout.css";

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const headerActionsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        headerActionsRef.current &&
        !headerActionsRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);
  
  const getPageTitle = () => {
    const path = location.pathname;

    if (path.startsWith("/dashboard")) {
      return "Dashboard";
    }

    if (path.startsWith("/Monitoring")) {
      return "실시간 모니터링";
    }

    if (path.startsWith("/multiview")) {
      return "다채널 멀티뷰";
    }

    if (path.startsWith("/subscriptions")) {
      return "구독 관리";
    }

    if (path.startsWith("/devices")) {
      return "기기 관리";
    }

    if (path.startsWith("/event-logs")) {
      return "이벤트 로그";
    }

    if (path.startsWith("/reports")) {
      return "통계 및 리포트";
    }

    if (path.startsWith("/settings")) {
      return "설정";
    }

    if (path.startsWith("/vpn")) {
      return "VPN 연결 관리";
    }

    return "SECURE CAM";
  };

  function handleLogout() {
    clearSession();

    sessionStorage.clear();

    setOpenMenu(null);

    navigate("/login", {
      replace: true
    });

    // try {
    //   await logout();
    // } finally {
    //   clearSession();
    //   sessionStorage.clear();

    //   navigate("/login", {
    //     replace: true
    //   });
    // }   백엔드 연결 시 변경

  }

  return (
    <div className="main-layout">
      <header className="common-header">

        <div className="header-left">
          <button
            type="button"
            className="menu-button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="메뉴 열기"
          >
            ☰
          </button>

          <h1 className="common-header-title">
            {getPageTitle()}
          </h1>
        </div>

        <div 
          className="header-actions"
          ref={headerActionsRef}
        >

          <div className="header-dropdown-wrapper">
            <button
              type="button"
              className="header-icon-button notification-button"
              onClick={() => 
                setOpenMenu((prev) =>
                  prev === "notification"
                    ? null
                    : "notification"
                )
              }
              aria-label="알림"
            >
              <svg
              viewBox="0 0 24 24"
              className="header-icon"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            > 
            <path
              d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 15 3 17H21C21 15 18 15 18 8Z"
              stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M10 21H14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
            </svg>
            <span className="notification-badge">
              {recentNotifications.length}
            </span>
          </button>

        
    {openMenu === "notification" && (
      <div className="header-dropdown notification-dropdown">

        <div className="dropdown-header">
          <strong>최근 알림</strong>

          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              navigate("/event-logs");
            }}
          >
            전체 보기
          </button>
        </div>


        <div className="notification-list">

          {recentNotifications.map((notification) => (
            <button
              type="button"
              className="notification-item"
              key={notification.id}
              onClick={() => {
                setOpenMenu(null);
                navigate("/event-logs");
              }}
            >
              <span className="notification-dot" />

              <div className="notification-content">
                <strong> {notification.type} </strong>
                <span> {notification.camera} </span>
                <small> {notification.time} </small>
              </div>
            </button>
          ))}

        </div>

      </div>
    )}

  </div>

      <div className="header-dropdown-wrapper">
        <button
          type="button"
          className="header-icon-button"
          onClick={() => 
            setOpenMenu((prev) =>
              prev === "settings"
                ? null
                : "settings"
            )
          }
          aria-label="설정"
        >
        <svg
          className="header-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />

          <path
            d="M19.4 15
               a1.65 1.65 0 0 0 .33 1.82
               l.06.06
               a2 2 0 1 1-2.83 2.83
               l-.06-.06
               a1.65 1.65 0 0 0-1.82-.33
               1.65 1.65 0 0 0-1 1.51V21
               a2 2 0 1 1-4 0
               v-.09
               a1.65 1.65 0 0 0-1-1.51
               1.65 1.65 0 0 0-1.82.33
               l-.06.06
               a2 2 0 1 1-2.83-2.83
               l.06-.06
               A1.65 1.65 0 0 0 4.6 15
               a1.65 1.65 0 0 0-1.51-1
               H3
               a2 2 0 1 1 0-4
               h.09
               a1.65 1.65 0 0 0 1.51-1
               1.65 1.65 0 0 0-.33-1.82
               l-.06-.06
               a2 2 0 1 1 2.83-2.83
               l.06.06
               a1.65 1.65 0 0 0 1.82.33
               h.01
               A1.65 1.65 0 0 0 10 3.17
               V3
               a2 2 0 1 1 4 0
               v.09
               a1.65 1.65 0 0 0 1 1.51
               1.65 1.65 0 0 0 1.82-.33
               l.06-.06
               a2 2 0 1 1 2.83 2.83
               l-.06.06
               a1.65 1.65 0 0 0-.33 1.82
               v.01
               A1.65 1.65 0 0 0 20.83 10
               H21
               a2 2 0 1 1 0 4
               h-.09
               A1.65 1.65 0 0 0 19.4 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          </svg>
        </button>

        {openMenu === "settings" && (
          <div className="header-dropdown settings-dropdown">
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                navigate("/settings/general");
              }}
            >
              일반 설정
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                navigate("/settings/notifications");
              }}
            >
              알림 설정
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                navigate("/settings/subscription");
              }}
            >
              구독 설정
            </button>
            </div>
        )}
        </div>

        <div className="header-action-divider"/>


        <div className="header-dropdown-wrapper">
          <button
            type="button"
            className="user-button"
            onClick={() => 
              setOpenMenu((prev) => 
              prev === "user"
                ? null
                : "user"
            )}
          >

            <span className="user-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
              </svg>
            </span>

            <span className="user-name">
              admin
            </span>

            <span
              className={`user-arrow ${
                openMenu === "user" ? "open" : ""
              }`}
            >
              ▾
            </span>
          </button>

          {openMenu === "user" && (
            <div className="header-dropdown user-dropdown">
              <button
                  type="button"
                  className="user-settings"
                  onClick={() => {
                    setOpenMenu(null);
                    navigate("/settings/account");
                  }}
              >
                사용자 설정
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </div>
          )}
          </div>
          </div>
        </header>


        <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Client VPN 연결 이상 시 재연결 안내 (WEB-F-050) */}
      <VpnAlertBanner />

      <Outlet />

      {/* API 오류 응답의 message 표시 */}
      <ApiErrorToast />

    </div>
  );
}

export default MainLayout;
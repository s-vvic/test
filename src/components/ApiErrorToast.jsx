// API 요청이 실패하면 서버가 보낸 message를 화면 아래에 잠깐 띄운다
// (api/client.js의 toApiError가 API_ERROR_EVENT를 보낸다)

import { useEffect, useState } from "react";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { API_ERROR_EVENT } from "../api/client";
import "./ApiErrorToast.css";

const VISIBLE_MS = 4000;

function ApiErrorToast() {
  // 같은 문구가 연달아 와도 타이머가 다시 돌도록 id를 같이 둔다
  const [toast, setToast] = useState(null);

  useEffect(() => {
    function handleApiError(event) {
      setToast({ id: Date.now(), message: event.detail.message });
    }

    window.addEventListener(API_ERROR_EVENT, handleApiError);

    return () => {
      window.removeEventListener(API_ERROR_EVENT, handleApiError);
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => setToast(null), VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) {
    return null;
  }

  return (
    <div key={toast.id} className="api-error-toast" role="alert">
      <FiAlertCircle className="api-error-toast-icon" aria-hidden="true" />

      <p className="api-error-toast-message">{toast.message}</p>

      <button
        type="button"
        className="api-error-toast-close"
        aria-label="닫기"
        onClick={() => setToast(null)}
      >
        <FiX />
      </button>
    </div>
  );
}

export default ApiErrorToast;

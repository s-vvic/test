import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchClientVpnStatus } from "../api/vpnApi";
import { VPN_UNREACHABLE_EVENT } from "../api/client";

const VpnContext = createContext(null);

export function VpnProvider({ children }) {
  // connecting | connected | disconnected | error
  const [ peerVpnStatus, setPeerVpnStatus ] = useState("disconnected");

  // 서버에 클라이언트 VPN 연결 확인 후 결과를 공유 상태에 반영
  const checkClientVpn = useCallback(async () => {
    setPeerVpnStatus("connecting");

    try {
      const connected = await fetchClientVpnStatus();

      setPeerVpnStatus(connected ? "connected" : "error");

      return connected;
    } catch (error) {
      console.error("VPN 상태 확인 실패:", error);

      setPeerVpnStatus("error");

      return false;
    }
  }, []);

  // 어떤 API 요청이든 서버에 닿지 못하면(네트워크 오류) VPN 안내 배너를 띄운다
  useEffect(() => {
    function handleUnreachable() {
      setPeerVpnStatus("error");
    }

    window.addEventListener(VPN_UNREACHABLE_EVENT, handleUnreachable);

    return () => {
      window.removeEventListener(VPN_UNREACHABLE_EVENT, handleUnreachable);
    };
  }, []);

  return (
    <VpnContext.Provider
      value={{ peerVpnStatus, setPeerVpnStatus, checkClientVpn }}
    >
      {children}
    </VpnContext.Provider>
  );
}

export function useVpn() {
  const context = useContext(VpnContext);

  if (!context) {
    throw new Error("useVpn은 VpnProvider 안에서만 사용할 수 있습니다.");
  }

  return context;
}

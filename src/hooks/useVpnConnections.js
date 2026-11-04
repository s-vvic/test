// VPN 연결 상태 목록 (ICD 2.5.1 GET /vpn/connections) — VPN 연결 관리 화면용
//
// enabled: false (지금 기본값)
//   - 서버에 요청하지 않고 목업(data/vpnDevices.js)만 보여 준다
//   - refresh()는 서버 연결 전 임시 새로고침 효과(0.6초 회전 후 갱신 시각만 바꿈)
//
// enabled: true (서버 연결 후)
//   - 화면에 들어오면 바로 한 번 불러오고, 그 뒤로 pollMs마다 다시 불러온다
//     (복구 요청 후 결과 · 핸드셰이크 시간 · 오류 상태 반영)
//   - 앞 요청이 끝난 뒤 pollMs를 기다렸다가 다음 요청을 보낸다 (요청이 겹치지 않음)
//   - 브라우저 탭이 숨겨져 있으면 건너뛴다
//   - 실패하면 이전 목록을 그대로 두고 계속 재시도한다 (자동 재조회 실패는 토스트를 띄우지 않음)

import { useCallback, useEffect, useRef, useState } from "react";
import { getVpnDevices } from "../api/vpnApi";
import { initialVpnDevices } from "../data/vpnDevices";

export const VPN_POLL_MS = 5000;

const MOCK_REFRESH_MS = 600;

function useVpnConnections({ enabled = false, pollMs = VPN_POLL_MS } = {}) {
  const [ devices, setDevices ] = useState(initialVpnDevices);
  const [ fetchedAt, setFetchedAt ] = useState(() => new Date());
  const [ isFetching, setIsFetching ] = useState(false);
  const inFlightRef = useRef(false);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsFetching(true);

    try {
      if (!enabled) {
        // 서버 연결 전 임시 새로고침 효과
        await new Promise((resolve) => setTimeout(resolve, MOCK_REFRESH_MS));
        setFetchedAt(new Date());
        return;
      }

      const list = await getVpnDevices({ silent });

      setDevices(list);
      setFetchedAt(new Date());
    } catch (error) {
      if (!silent) {
        console.warn("[useVpnConnections] VPN 연결 상태 조회 실패", error);
      }
    } finally {
      inFlightRef.current = false;
      setIsFetching(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let timer = null;
    let stopped = false;

    async function tick(silent) {
      if (!document.hidden) {
        await load({ silent });
      }

      if (!stopped && pollMs > 0) {
        timer = setTimeout(() => tick(true), pollMs);
      }
    }

    tick(false);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [enabled, load, pollMs]);

  const refresh = useCallback(() => load(), [load]);

  return { devices, setDevices, fetchedAt, isFetching, refresh };
}

export default useVpnConnections;

import { useState } from "react";
import useVpnConnections from "../hooks/useVpnConnections";
import Pagination from "../components/Pagination";
import useFitPagination from "../hooks/useFitPagination";
import Toggle from "../components/Toggle";
import { useNavigate } from "react-router-dom";
import VpnSummary from "../components/vpn/VpnSummary";
import VpnDeviceTable from "../components/vpn/VpnDeviceTable";
import { useVpn } from "../context/VpnContext";
import { VPN_STATUS_META } from "../components/charts/chartColors";
import VpnDeviceDetailModal from "../components/vpn/VpnDeviceDetailModal";
import { requestVpnRecovery } from "../api/vpnApi";
// import { fetchClientVpnStatus } from "../api/vpnApi";  // 서버 연결 후 주석 해제
import "./VpnManage.css";

/* VPN 연결 상태 목록 (ICD 2.5.1 GET /vpn/connections) 서버 연동 스위치
   - false (지금): 서버에 요청하지 않고 목업(data/vpnDevices.js) 표시, 복구 · 새로고침도 화면에서만 동작
   - true: 화면에 있는 동안 5초마다 목록 재조회, 복구 요청은 POST /vpn/connections/{mac}/recover 후 바로 재조회 */
const VPN_API_ENABLED = false;

function VpnManage() {
  const navigate = useNavigate();
    const { peerVpnStatus, setPeerVpnStatus } = useVpn();
    const {
        devices,
        setDevices,
        fetchedAt,
        isFetching: refreshing,
        refresh,
    } = useVpnConnections({ enabled: VPN_API_ENABLED });
    const [ searchKeyword, setSearchKeyword ] = useState("");
    const [ statusFilter, setStatusFilter ] = useState("all");
    const lastUpdated = fetchedAt.toLocaleString();

    // WEB-F-054 상세 정보 모달
    const [ selectedDevice, setSelectedDevice ] = useState(null);

    /* 상태 요약 */
    const totalDevices = devices.length;

    const connectedDevices = devices.filter(
        (device) => device.vpnStatus === "connected"
    ).length;

    const disconnectedDevices = devices.filter(
        (device) => device.vpnStatus === "disconnected"
    ).length;

    const errorDevices = devices.filter(
        (device) => device.vpnStatus === "error"
    ).length;

    /* 검색, 필터 */
    const filteredDevices = devices.filter((devices) => {
        const keyword = searchKeyword.toLowerCase();
        
        const matchesSearch = 
            devices.name.toLowerCase().includes(keyword) ||
            devices.serial.toLowerCase().includes(keyword);
        
        const matchesStatus = 
            statusFilter === "all" ||
            devices.vpnStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    /* pagination: 화면 높이에 들어가는 만큼만 한 페이지에 표시 */
    const {
        areaRef: tableAreaRef,
        pageItems: currentDevices,
        page: currentPage,
        setPage: setCurrentPage,
        totalPages,
    } = useFitPagination(filteredDevices);

    /* search */
    function handleSearchChange(e) {
        setSearchKeyword(e.target.value);
        setCurrentPage(1);
    }

    /* filter */
    function handleStatusChange(e) {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    }

    function handleFilterReset() {
        setSearchKeyword("");
        setStatusFilter("all");
        setCurrentPage(1);
    }

    /* 복구 요청 */
    async function handleConnection(deviceId) {
        // 서버 연동 시: 복구 요청(POST /vpn/connections/{mac}/recover) 뒤 목록을 바로 다시 받는다
        // (서버 데이터의 deviceId는 MAC 주소)
        if (VPN_API_ENABLED) {
            try {
                await requestVpnRecovery(deviceId);
                await refresh();
            } catch (error) {
                console.error(error);
            }
            return;
        }

        // 서버 연결 전: 화면에서만 연결 / 끊김을 바꾼다
        setDevices((prev) => 
            prev.map((device) => {
                if (device.id !== deviceId) {
                    return device;
                }
                const isConnected = 
                    device.vpnStatus === "connected";
                return {
                    ...device,
                    vpnStatus: isConnected
                        ? "disconnected"
                        : "connected",
                    duration: isConnected
                        ? "-"
                        : "방금 연결됨",
                    vpnIp: isConnected
                        ? "-"
                        : device.assignedIp ?? "-",
                    lastHandshake: isConnected
                        ? "-"
                        : new Date().toLocaleString(),
                    error: null
                };
            })
        );
    }

    /* auto connect toggle */
    function handleToggle(deviceId, key) {
        setDevices((prev) => 
            prev.map((device) =>
              device.id === deviceId
                ? {
                    ...device,
                    [key]: !device[key]
                  }
                : device
            ) 
        );
    }

    async function handlePeerReconnect() {
      setPeerVpnStatus("connecting");
      try {

        /*  실제 서버 연동 시 사용
        // 브라우저는 WireGuard를 직접 켤 수 없어서(ICD 2.8 [TBR]) OS WireGuard 앱으로 연결한 뒤 연결 여부만 다시 확인한다
        const connected = await fetchClientVpnStatus();

        if (connected) {
          setPeerVpnStatus("connected");

          setTimeout(() => {
            navigate("/dashboard", {replace: true});
          }, 1200);
        } else {
          setPeerVpnStatus("error");
        }  */

        //현재 테스트용

        setTimeout(() => {
          const connectSuccess = true;

          if (connectSuccess) {
            setPeerVpnStatus("connected");
          } else {
            setPeerVpnStatus("error");
          }
        }, 1500);
  
      } catch (error) {
        console.error("VPN 연결 실패:", error);

        setPeerVpnStatus("error");
      }
    }


    /* 새로고침 버튼: 서버 연동 시 GET /vpn/connections, 서버 연결 전에는 임시 새로고침 효과 */
    function handleRefresh() {
      refresh();
    }

    return (
      <main className="vpn-page">

        {/* Client VPN 연결 + 카메라 VPN 상태 요약 */}
        <VpnSummary
          peerStatus={peerVpnStatus}
          onPeerReconnect={handlePeerReconnect}
          totalDevices={totalDevices}
          connectedDevices={connectedDevices}
          disconnectedDevices={disconnectedDevices}
          errorDevices={errorDevices}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
        />

        <section className="vpn-table-section">
          <div className="vpn-toolbar">
            <input
              type="text"
              placeholder="카메라 이름 또는 시리얼 번호 검색"
              value={searchKeyword}
              onChange={handleSearchChange}
            />

            <select
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">
                연결 상태 전체
              </option>
              {Object.entries(VPN_STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="filter-reset-button"
              onClick={handleFilterReset}
            >
              필터 초기화
            </button>
          </div>

          <div className="vpn-table-area" ref={tableAreaRef}>
            <VpnDeviceTable
              devices={currentDevices}
              onToggle={handleToggle}
              onRecoveryRequest={handleConnection}
              onSelect={setSelectedDevice}
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredDevices.length}
            itemLabel="대"
          />
        </section>

        {selectedDevice && (
          <VpnDeviceDetailModal
            device={selectedDevice}
            onClose={() => setSelectedDevice(null)}
          />
        )}
      </main>
    );
}

export default VpnManage;
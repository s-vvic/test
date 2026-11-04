import { useEffect, useState } from "react";
import Toggle from "../../components/Toggle";
import { getGeneralSettings } from "../../api/settingsApi";
// import { getGeneralSettings, updateGeneralSetting } from "../../api/settingsApi";  // 서버 연결 후 저장 호출 주석 해제 시
import "./Settings.css";

function GeneralSettings() {
  const [settings, setSettings] = useState({
    autoRefresh: true,
    showOfflineBoards: true,
    defaultChannel: 6
  });

  useEffect(() => {
    async function loadGeneralSettings() {
        try {
            const data = await getGeneralSettings();

            setSettings(data);
        } catch (error) {
            console.error(error);
        }
    }
    loadGeneralSettings();
  },[]);

  //서버 연결 후에는 삭제
function handleToggle(key) {
  setSettings((prev) => ({
    ...prev,
    [key]: !prev[key]
  }));
}

function handleChannelChange(e) {
  const newChannel = Number(e.target.value);

  setSettings((prev) => ({
    ...prev,
    defaultChannel: newChannel
  }));
}

  /*
  async function handleToggle(key) {
    const newValue = !settings[key];

    setSettings((prev) => ({
        ...prev,
        [key]: newValue
    }));

    try {
        await updateGeneralSetting(key, newValue);
    } catch (error) {
        console.error(error);
        setSettings((prev) => ({
            ...prev,
            [key]: !newValue
        }));
    }
  }  */

/*
  async function handleChannelChange(e) {
    const newChannel = Number(e.target.value);
    const oldChannel = settings.defaultChannel;

    setSettings((prev) => ({
        ...prev,
        defaultChannel: newChannel
    }));

    try {
        await updateGeneralSetting("defaultChannel", newChannel);
    } catch (error) {
        console.error(error);
        setSettings((prev) => ({
            ...prev,
            defaultChannel: oldChannel
        }));
    }
  }  */


  return (
    <div className="settings-section">
      <h2>일반 설정</h2>

      <div className="setting-card">
        <div>
          <strong>자동 새로고침</strong>
          <p>보드 상태와 이벤트 정보를 자동으로 갱신합니다.</p>
        </div>

        <Toggle
          checked={settings.autoRefresh}
          onChange={() => handleToggle("autoRefresh")}
        />
      </div>

      <div className="setting-card">
        <div>
          <strong>오프라인 보드 표시</strong>
          <p>멀티뷰와 대시보드에서 오프라인 보드를 표시합니다.</p>
        </div>

        <Toggle
          checked={settings.showOfflineBoards}
          onChange={() => handleToggle("showOfflineBoards")}
        />
      </div>

      <div className="setting-card">
        <div>
          <strong>기본 멀티뷰 채널</strong>
          <p>멀티뷰 진입 시 기본으로 표시할 채널 수입니다.</p>
        </div>

        <select
          value={settings.defaultChannel}
          onChange={handleChannelChange}
        >
          <option value="2">2채널</option>
          <option value="4">4채널</option>
          <option value="6">6채널</option>
        </select>
      </div>
    </div>
  );
}

export default GeneralSettings;
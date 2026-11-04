// 이벤트 로그 목업 (서버 연결 전 시연용)
// 발생 시간은 화면을 연 시점 기준 상대 시간 → 날짜가 지나도 기간 선택(오늘 / 7일 / 30일 / 60일)이 항상 맞게 동작
//   오늘 4건 · 최근 7일 7건 · 최근 30일 9건 · 최근 60일 10건

const pad = (value) => String(value).padStart(2, "0");

// 지금으로부터 days / hours / minutes / seconds 전 → "YYYY-MM-DDTHH:mm:ss" (로컬 시간)
function ago({ days = 0, hours = 0, minutes = 0, seconds = 0 }) {
  const date = new Date(
    Date.now() - (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000
  );

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export const eventLogs = [
  {
    id: 1,
    occurredAt: ago({ minutes: 12, seconds: 15 }),
    cameraId: "CAM-0001",
    cameraName: "CAM-01",
    location: "출입구",
    type: "sound",
    status: "unconfirmed",
    description: "출입구에서 소리가 감지되었습니다.",
    snapshotUrl: "/images/event-entrance.jpg",
    videoUrl: null,
    memo: "",
  },
  {
    id: 2,
    occurredAt: ago({ minutes: 24, seconds: 8 }),
    cameraId: "CAM-0003",
    cameraName: "CAM-03",
    location: "창고",
    type: "vpn_disconnect",
    status: "confirmed",
    description: "카메라의 VPN 연결이 끊어졌습니다.",
    snapshotUrl: null,
    videoUrl: null,
    memo: "",
  },
  {
    id: 3,
    occurredAt: ago({ minutes: 52, seconds: 41 }),
    cameraId: "CAM-0005",
    cameraName: "CAM-05",
    location: "주차장",
    type: "motion",
    status: "unconfirmed",
    description: "주차장에서 움직임이 감지되었습니다.",
    snapshotUrl: "/images/event-parking.jpg",
    videoUrl: null,
    memo: "",
  },
  {
    id: 4,
    occurredAt: ago({ hours: 1, minutes: 5, seconds: 12 }),
    cameraId: "CAM-0002",
    cameraName: "CAM-02",
    location: "복도",
    type: "camera_connect",
    status: "confirmed",
    description: "카메라가 서버에 연결되었습니다.",
    snapshotUrl: null,
    videoUrl: null,
    memo: "",
  },
  {
    id: 5,
    occurredAt: ago({ days: 1, hours: 2, minutes: 15 }),
    cameraId: "CAM-0004",
    cameraName: "CAM-04",
    location: "사무실",
    type: "motion",
    status: "unconfirmed",
    description: "사무실에서 움직임이 감지되었습니다.",
    snapshotUrl: "/images/event-office.jpg",
    videoUrl: null,
    memo: "",
  },
  {
    id: 6,
    occurredAt: ago({ days: 2, hours: 3, minutes: 40 }),
    cameraId: "CAM-0001",
    cameraName: "CAM-01",
    location: "출입구",
    type: "sound",
    status: "unconfirmed",
    description: "출입구에서 소리가 감지되었습니다.",
    snapshotUrl: "/images/event-entrance.jpg",
    videoUrl: null,
    memo: "",
  },
  {
    id: 7,
    occurredAt: ago({ days: 5, hours: 1, minutes: 20 }),
    cameraId: "CAM-0006",
    cameraName: "CAM-06",
    location: "후문",
    type: "vpn_connect",
    status: "confirmed",
    description: "VPN 연결이 정상적으로 복구되었습니다.",
    snapshotUrl: null,
    videoUrl: null,
    memo: "",
  },
  {
    id: 8,
    occurredAt: ago({ days: 12, hours: 4, minutes: 10 }),
    cameraId: "CAM-0003",
    cameraName: "CAM-03",
    location: "창고",
    type: "sound",
    status: "unconfirmed",
    description: "창고에서 소리가 감지되었습니다.",
    snapshotUrl: "/images/event-storage.jpg",
    videoUrl: null,
    memo: "",
  },
  {
    id: 9,
    occurredAt: ago({ days: 25, hours: 2, minutes: 30 }),
    cameraId: "CAM-0007",
    cameraName: "CAM-07",
    location: "외부",
    type: "motion",
    status: "confirmed",
    description: "외부 카메라에서 움직임이 감지되었습니다.",
    snapshotUrl: "/images/event-outside.jpg",
    videoUrl: null,
    memo: "",
  },
  {
    id: 10,
    occurredAt: ago({ days: 45, hours: 5, minutes: 5 }),
    cameraId: "CAM-0002",
    cameraName: "CAM-02",
    location: "복도",
    type: "camera_disconnect",
    status: "confirmed",
    description: "카메라 연결이 끊어졌습니다.",
    snapshotUrl: null,
    videoUrl: null,
    memo: "",
  },
];
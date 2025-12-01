
// Cloudflare Pages 會自動將 /api 請求導向 functions，所以這裡留空即可使用相對路徑
export const API_BASE_URL = ""; 

// 設定為 false 以使用 Cloudflare Pages Functions 後端
// 設定為 true 以強制使用瀏覽器 localStorage 測試
export const USE_MOCK_DATA = false;

export const MOCK_DELAY = 400;

export const DEFAULT_START_PASSWORD = "secure-start";
export const DEFAULT_ADMIN_USER = {
  id: "admin-1",
  username: "admin",
  password: "12345",
  role: "admin",
  votesAllowed: 10,
  ip: "127.0.0.1",
  location: "系統控制台",
  lastSeen: Date.now(),
};

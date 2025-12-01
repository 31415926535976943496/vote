// Switch this to your Cloudflare Worker URL in production
// e.g., "https://my-voting-worker.username.workers.dev"
export const API_BASE_URL = ""; 

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
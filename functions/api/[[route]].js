
/**
 * Cloudflare Pages Functions - 單一後端檔案
 * 這取代了原本的 worker.js，專為 Pages 架構設計。
 * 
 * 部署說明:
 * 1. 確保在 Pages 設定中綁定 KV Namespace，變數名稱設為 "KV"
 * 2. 此外掛會自動處理 /api/* 的所有請求
 */

// 預設資料
const DEFAULT_DATA = {
  config: { startPassword: "secure-start" },
  users: [
    {
      id: "admin-1",
      username: "admin",
      password: "12345",
      role: "admin",
      votesAllowed: 10,
      ip: "127.0.0.1",
      location: "系統控制台",
      lastSeen: Date.now(),
    }
  ],
  sessions: []
};

// 讀取 KV
async function getData(env) {
  const data = await env.KV.get('data');
  return data ? JSON.parse(data) : DEFAULT_DATA;
}

// 寫入 KV
async function saveData(env, data) {
  await env.KV.put('data', JSON.stringify(data));
}

// Pages Functions 的進入點
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // 簡單的 CORS 處理
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // --- API 路由處理 ---

    // 1. 初始化檢查 (檢查網站密碼)
    if (path === '/api/init' && request.method === 'POST') {
      const { password } = await request.json();
      const data = await getData(env);
      if (password === data.config.startPassword) {
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: CORS_HEADERS });
      }
      return new Response(JSON.stringify({ error: '密碼無效' }), { status: 401, headers: CORS_HEADERS });
    }

    // 2. 登入
    if (path === '/api/login' && request.method === 'POST') {
      const { username, password } = await request.json();
      const data = await getData(env);
      const user = data.users.find(u => u.username === username && u.password === password);
      
      if (user) {
        // 更新追蹤資訊
        user.ip = request.headers.get('CF-Connecting-IP') || '未知';
        user.location = request.cf ? `${request.cf.city}, ${request.cf.country}` : '未知';
        user.lastSeen = Date.now();
        await saveData(env, data);
        return new Response(JSON.stringify(user), { status: 200, headers: CORS_HEADERS });
      }
      return new Response(JSON.stringify({ error: '憑證無效' }), { status: 401, headers: CORS_HEADERS });
    }

    // 3. 獲取所有資料 (管理員用)
    if (path === '/api/data' && request.method === 'GET') {
      const data = await getData(env);
      return new Response(JSON.stringify(data), { status: 200, headers: CORS_HEADERS });
    }

    // 4. 新增或更新使用者
    if (path === '/api/user' && request.method === 'POST') {
      const user = await request.json();
      const data = await getData(env);
      const idx = data.users.findIndex(u => u.id === user.id);
      
      if (idx >= 0) {
        // 保留原有的追蹤資訊
        user.ip = data.users[idx].ip;
        user.location = data.users[idx].location;
        user.lastSeen = data.users[idx].lastSeen;
        data.users[idx] = user;
      } else {
        data.users.push(user);
      }
      
      await saveData(env, data);
      return new Response(JSON.stringify(user), { status: 200, headers: CORS_HEADERS });
    }

    // 5. 刪除使用者
    // 匹配 /api/user/xxxx-xxxx
    if (path.startsWith('/api/user/') && request.method === 'DELETE') {
      const userId = path.split('/').pop();
      const data = await getData(env);
      data.users = data.users.filter(u => u.id !== userId);
      await saveData(env, data);
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: CORS_HEADERS });
    }

    // 6. 新增或更新投票活動
    if (path === '/api/session' && request.method === 'POST') {
      const session = await request.json();
      const data = await getData(env);
      const idx = data.sessions.findIndex(s => s.id === session.id);
      
      if (idx >= 0) data.sessions[idx] = session;
      else data.sessions.push(session);
      
      await saveData(env, data);
      return new Response(JSON.stringify(session), { status: 200, headers: CORS_HEADERS });
    }

    // 7. 刪除投票活動
    if (path.startsWith('/api/session/') && request.method === 'DELETE') {
      const sessionId = path.split('/').pop();
      const data = await getData(env);
      data.sessions = data.sessions.filter(s => s.id !== sessionId);
      await saveData(env, data);
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: CORS_HEADERS });
    }

    // 8. 投票
    if (path === '/api/vote' && request.method === 'POST') {
      const { sessionId, optionId, userId } = await request.json();
      const data = await getData(env);
      
      const session = data.sessions.find(s => s.id === sessionId);
      
      if (!session || !session.isActive) {
         return new Response('投票活動無效或已結束', { status: 400, headers: CORS_HEADERS });
      }

      if (!session.allowedUserIds.includes(userId)) {
         return new Response('您不被允許參與此投票', { status: 403, headers: CORS_HEADERS });
      }

      const votesUsed = session.userVotes[userId] || 0;
      if (votesUsed >= session.votesPerUser) {
         return new Response('已超過投票配額', { status: 400, headers: CORS_HEADERS });
      }

      const option = session.options.find(o => o.id === optionId);
      if (option) {
        option.count++;
        session.userVotes[userId] = votesUsed + 1;
        await saveData(env, data);
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: CORS_HEADERS });
      }
      
      return new Response('找不到該選項', { status: 400, headers: CORS_HEADERS });
    }
    
    return new Response('API Not Found', { status: 404, headers: CORS_HEADERS });

  } catch (err) {
    return new Response(err.message, { status: 500, headers: CORS_HEADERS });
  }
}

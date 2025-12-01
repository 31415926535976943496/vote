/**
 * Cloudflare Worker for SecureVote
 * 
 * Instructions:
 * 1. Create a KV Namespace named "KV" and bind it to this worker.
 * 2. Deploy this script.
 * 3. Update the API_BASE_URL in the frontend constants.ts
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Default Initial Data
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

async function getData(env) {
  const data = await env.KV.get('data');
  return data ? JSON.parse(data) : DEFAULT_DATA;
}

async function saveData(env, data) {
  await env.KV.put('data', JSON.stringify(data));
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // --- INIT / CHECK SITE PASSWORD ---
      if (path === '/api/init' && request.method === 'POST') {
        const { password } = await request.json();
        const data = await getData(env);
        if (password === data.config.startPassword) {
          return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: CORS_HEADERS });
        }
        return new Response(JSON.stringify({ error: '密碼無效' }), { status: 401, headers: CORS_HEADERS });
      }

      // --- LOGIN ---
      if (path === '/api/login' && request.method === 'POST') {
        const { username, password } = await request.json();
        const data = await getData(env);
        const user = data.users.find(u => u.username === username && u.password === password);
        
        if (user) {
          // Update tracking info
          user.ip = request.headers.get('CF-Connecting-IP') || '未知';
          user.location = request.cf ? `${request.cf.city}, ${request.cf.country}` : '未知';
          user.lastSeen = Date.now();
          await saveData(env, data);
          return new Response(JSON.stringify(user), { status: 200, headers: CORS_HEADERS });
        }
        return new Response(JSON.stringify({ error: '憑證無效' }), { status: 401, headers: CORS_HEADERS });
      }

      // --- GET ALL DATA (Admin Only - simplified auth for demo) ---
      if (path === '/api/data' && request.method === 'GET') {
        const data = await getData(env);
        return new Response(JSON.stringify(data), { status: 200, headers: CORS_HEADERS });
      }

      // --- USER CRUD ---
      if (path === '/api/user' && request.method === 'POST') {
        const user = await request.json();
        const data = await getData(env);
        const idx = data.users.findIndex(u => u.id === user.id);
        
        // Preserve tracking data if updating
        if (idx >= 0) {
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

      // --- SESSION CRUD ---
      if (path === '/api/session' && request.method === 'POST') {
        const session = await request.json();
        const data = await getData(env);
        const idx = data.sessions.findIndex(s => s.id === session.id);
        
        if (idx >= 0) data.sessions[idx] = session;
        else data.sessions.push(session);
        
        await saveData(env, data);
        return new Response(JSON.stringify(session), { status: 200, headers: CORS_HEADERS });
      }

      // --- VOTE ---
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
      
      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });

    } catch (err) {
      return new Response(err.message, { status: 500, headers: CORS_HEADERS });
    }
  }
};
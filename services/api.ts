
import { AppState, Session, User } from '../types';
import { API_BASE_URL, DEFAULT_ADMIN_USER, DEFAULT_START_PASSWORD, MOCK_DELAY, USE_MOCK_DATA } from '../constants';

// --- Mock Data Helper ---
const getMockData = (): AppState => {
  const stored = localStorage.getItem('secureVoteData');
  if (stored) return JSON.parse(stored);
  
  const initial: AppState = {
    config: { startPassword: DEFAULT_START_PASSWORD },
    users: [DEFAULT_ADMIN_USER as User],
    sessions: [],
  };
  localStorage.setItem('secureVoteData', JSON.stringify(initial));
  return initial;
};

const setMockData = (data: AppState) => {
  localStorage.setItem('secureVoteData', JSON.stringify(data));
};

// --- API Methods ---

export const checkStartPassword = async (password: string): Promise<boolean> => {
  if (USE_MOCK_DATA) {
    const data = getMockData();
    return data.config.startPassword === password;
  }
  const res = await fetch(`${API_BASE_URL}/api/init`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return res.ok;
};

export const login = async (username: string, password: string): Promise<User | null> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    const data = getMockData();
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
      // Update last seen
      user.lastSeen = Date.now();
      user.ip = "192.168.1." + Math.floor(Math.random() * 255);
      user.location = ["美國紐約", "英國倫敦", "日本東京", "德國柏林"][Math.floor(Math.random() * 4)];
      setMockData(data);
      return user;
    }
    return null;
  }
  
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  return res.json();
};

export const fetchData = async (): Promise<AppState> => {
  if (USE_MOCK_DATA) {
    await new Promise(r => setTimeout(r, MOCK_DELAY));
    return getMockData();
  }
  const res = await fetch(`${API_BASE_URL}/api/data`);
  return res.json();
};

export const saveUser = async (user: User): Promise<User> => {
  if (USE_MOCK_DATA) {
    const data = getMockData();
    const idx = data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      data.users[idx] = user;
    } else {
      data.users.push(user);
    }
    setMockData(data);
    return user;
  }
  const res = await fetch(`${API_BASE_URL}/api/user`, {
    method: 'POST',
    body: JSON.stringify(user),
  });
  return res.json();
};

export const deleteUser = async (userId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    const data = getMockData();
    data.users = data.users.filter(u => u.id !== userId);
    setMockData(data);
    return;
  }
  await fetch(`${API_BASE_URL}/api/user/${userId}`, { method: 'DELETE' });
};

export const saveSession = async (session: Session): Promise<Session> => {
  if (USE_MOCK_DATA) {
    const data = getMockData();
    const idx = data.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      data.sessions[idx] = session;
    } else {
      data.sessions.push(session);
    }
    setMockData(data);
    return session;
  }
  const res = await fetch(`${API_BASE_URL}/api/session`, {
    method: 'POST',
    body: JSON.stringify(session),
  });
  return res.json();
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    const data = getMockData();
    data.sessions = data.sessions.filter(s => s.id !== sessionId);
    setMockData(data);
    return;
  }
  await fetch(`${API_BASE_URL}/api/session/${sessionId}`, { method: 'DELETE' });
};

export const submitVote = async (sessionId: string, optionId: string, userId: string): Promise<boolean> => {
  if (USE_MOCK_DATA) {
    const data = getMockData();
    const session = data.sessions.find(s => s.id === sessionId);
    const user = data.users.find(u => u.id === userId);
    
    if (!session || !user) return false;
    
    // Check quota
    const votesUsed = session.userVotes[userId] || 0;
    if (votesUsed >= session.votesPerUser) return false;
    if (!session.allowedUserIds.includes(userId)) return false;
    if (!session.isActive) return false;

    // Apply vote
    const option = session.options.find(o => o.id === optionId);
    if (option) {
      option.count++;
      session.userVotes[userId] = votesUsed + 1;
      setMockData(data);
      return true;
    }
    return false;
  }
  
  const res = await fetch(`${API_BASE_URL}/api/vote`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, optionId, userId }),
  });
  return res.ok;
};

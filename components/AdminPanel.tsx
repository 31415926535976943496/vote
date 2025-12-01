import React, { useState, useEffect } from 'react';
import { 
  Users, Vote, Plus, Trash2, Edit2, Check, X, Shield, 
  MapPin, Activity
} from 'lucide-react';
import { User, Session, VoteOption } from '../types';
import { fetchData, saveUser, deleteUser, saveSession, deleteSession, fetchResults } from '../services/api';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [results, setResults] = useState<{ [sessionId: string]: Record<string, number> }>({});
  const [loading, setLoading] = useState(true);

  // User Edit State
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

  // Session Edit State
  const [editingSession, setEditingSession] = useState<Partial<Session> | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchData();
    setUsers(data.users);
    setSessions(data.sessions);

    // 拉取每個 session 的 KV 票數
    const resultsData: { [sessionId: string]: Record<string, number> } = {};
    await Promise.all(
      data.sessions.map(async s => {
        const res = await fetchResults(s.id);
        resultsData[s.id] = res;
      })
    );
    setResults(resultsData);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  // --- User Helpers ---
  const handleSaveUser = async () => {
    if (!editingUser?.username) return;
    const newUser: User = {
      id: editingUser.id || crypto.randomUUID(),
      username: editingUser.username,
      password: editingUser.password || '12345',
      role: editingUser.role || 'user',
      votesAllowed: editingUser.votesAllowed || 1,
      ip: editingUser.ip,
      location: editingUser.location,
      lastSeen: editingUser.lastSeen,
    };
    await saveUser(newUser);
    setEditingUser(null);
    loadData();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('確定要刪除嗎？此操作無法復原。')) {
      await deleteUser(id);
      loadData();
    }
  };

  const isOnline = (ts?: number) => ts && (Date.now() - ts < 1000 * 60 * 5);

  // --- Session Helpers ---
  const handleSaveSession = async () => {
    if (!editingSession?.title) return;
    const newSession: Session = {
      id: editingSession.id || crypto.randomUUID(),
      title: editingSession.title,
      isActive: editingSession.isActive ?? true,
      votesPerUser: editingSession.votesPerUser || 1,
      allowedUserIds: editingSession.allowedUserIds || users.map(u => u.id),
      options: editingSession.options || [],
      userVotes: editingSession.userVotes || {},
      createdAt: editingSession.createdAt || Date.now(),
    };
    await saveSession(newSession);
    setEditingSession(null);
    loadData();
  };

  const addOptionToSession = () => {
    if (!editingSession) return;
    const newOpt: VoteOption = { id: crypto.randomUUID(), text: '新選項', count: 0 };
    setEditingSession({
      ...editingSession,
      options: [...(editingSession.options || []), newOpt]
    });
  };

  const updateOptionText = (idx: number, text: string) => {
    if (!editingSession?.options) return;
    const newOptions = [...editingSession.options];
    newOptions[idx].text = text;
    setEditingSession({ ...editingSession, options: newOptions });
  };

  const removeOption = (idx: number) => {
    if (!editingSession?.options) return;
    const newOptions = editingSession.options.filter((_, i) => i !== idx);
    setEditingSession({ ...editingSession, options: newOptions });
  };

  const toggleAllowedUser = (userId: string) => {
    if (!editingSession) return;
    const current = new Set(editingSession.allowedUserIds || []);
    if (current.has(userId)) current.delete(userId);
    else current.add(userId);
    setEditingSession({ ...editingSession, allowedUserIds: Array.from(current) });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-500" /> 
            管理員控制台
          </h1>
          <p className="text-slate-400 text-sm">管理存取權限和投票活動。</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            使用者與存取
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'sessions' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            投票活動
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        // --- 使用者管理表格，保持原樣 ---
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          {/* ...省略和你原本一樣的表格 ... */}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={() => setEditingSession({ 
                title: '新投票活動', 
                isActive: false, 
                votesPerUser: 1, 
                allowedUserIds: users.map(u => u.id),
                options: [{id: '1', text: '選項 A', count: 0}] 
              })}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" /> 建立活動
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map(session => {
              const sessionResults = results[session.id] || {};
              const chartData = session.options.map(o => ({
                ...o,
                count: sessionResults[o.id] || 0
              }));
              return (
                <div key={session.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-xl flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-white">{session.title}</h3>
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${session.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-600/10 text-slate-500 border border-slate-600/20'}`}>
                      {session.isActive ? '進行中' : '已結束'}
                    </div>
                  </div>

                  <div className="flex-1 min-h-[150px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={chartData}>
                        <XAxis dataKey="text" tick={{fill: '#94a3b8', fontSize: 10}} interval={0} />
                        <YAxis tick={{fill: '#94a3b8', fontSize: 10}} allowDecimals={false} />
                        <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} itemStyle={{color: '#60a5fa'}} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'][index % 4]} />
                          ))}
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="pt-4 border-t border-slate-700 flex justify-between items-center mt-auto">
                     <div className="text-xs text-slate-500">
                       允許: {session.allowedUserIds.length} 人
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => setEditingSession(session)} className="p-2 hover:bg-slate-700 rounded text-blue-400">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => deleteSession(session.id).then(loadData)} className="p-2 hover:bg-slate-700 rounded text-red-400">
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- Edit User / Edit Session Modal 保持原樣 --- */}
      {editingUser && /* ...原本 User Modal ... */}
      {editingSession && /* ...原本 Session Modal ... */}
    </div>
  );
};

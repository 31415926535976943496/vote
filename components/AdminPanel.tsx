import React, { useState, useEffect } from 'react';
import { 
  Users, Vote, Plus, Trash2, Edit2, Check, X, Shield, 
  MapPin, Activity, Save, RefreshCw, BarChart
} from 'lucide-react';
import { User, Session, VoteOption } from '../types';
import { fetchData, saveUser, deleteUser, saveSession, deleteSession } from '../services/api';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'sessions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
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
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Auto-refresh for live results
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

  const isOnline = (ts?: number) => ts && (Date.now() - ts < 1000 * 60 * 5); // 5 mins

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
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              使用者帳戶
            </h3>
            <button 
              onClick={() => setEditingUser({ role: 'user', votesAllowed: 3 })}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> 新增使用者
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-6 py-4">狀態</th>
                  <th className="px-6 py-4">使用者名稱</th>
                  <th className="px-6 py-4">密碼</th>
                  <th className="px-6 py-4">詳細資訊</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOnline(user.lastSeen) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-500'}`} />
                        <span className="text-slate-400 text-xs">{isOnline(user.lastSeen) ? '在線' : '離線'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{user.password}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {user.location || '未知'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <Activity className="w-3 h-3" />
                          {user.ip || '無 IP 紀錄'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-slate-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.role !== 'admin' && (
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-slate-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            {sessions.map(session => (
              <div key={session.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-xl flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-white">{session.title}</h3>
                  <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${session.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-600/10 text-slate-500 border border-slate-600/20'}`}>
                    {session.isActive ? '進行中' : '已結束'}
                  </div>
                </div>

                <div className="flex-1 min-h-[150px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={session.options}>
                      <XAxis dataKey="text" tick={{fill: '#94a3b8', fontSize: 10}} interval={0} />
                      <YAxis tick={{fill: '#94a3b8', fontSize: 10}} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}}
                        itemStyle={{color: '#60a5fa'}}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {session.options.map((entry, index) => (
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
            ))}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">使用者設定</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">使用者名稱</label>
                <input 
                  value={editingUser.username || ''}
                  onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">密碼</label>
                <input 
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-slate-400 uppercase font-bold">角色</label>
                   <select 
                      value={editingUser.role || 'user'}
                      onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mt-1"
                   >
                     <option value="user">一般使用者</option>
                     <option value="admin">管理員</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs text-slate-400 uppercase font-bold">預設票數</label>
                   <input 
                      type="number"
                      value={editingUser.votesAllowed || 1}
                      onChange={e => setEditingUser({...editingUser, votesAllowed: parseInt(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mt-1"
                   />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-400 hover:text-white">取消</button>
              <button onClick={handleSaveUser} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium">儲存帳戶</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">活動設定</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">活動標題</label>
                  <input 
                    value={editingSession.title || ''}
                    onChange={e => setEditingSession({...editingSession, title: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mt-1"
                  />
                </div>
                <div>
                   <label className="text-xs text-slate-400 uppercase font-bold">每人票數</label>
                   <input 
                      type="number"
                      min={1}
                      value={editingSession.votesPerUser || 1}
                      onChange={e => setEditingSession({...editingSession, votesPerUser: parseInt(e.target.value)})}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white mt-1"
                   />
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded border border-slate-700">
                  <input 
                    type="checkbox" 
                    checked={editingSession.isActive}
                    onChange={e => setEditingSession({...editingSession, isActive: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700"
                  />
                  <span className="text-sm font-medium text-white">活動進行中 (接受投票)</span>
                </div>
                
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">允許的參與者</label>
                  <div className="h-40 overflow-y-auto bg-slate-800 border border-slate-700 rounded p-2 space-y-1">
                    {users.filter(u => u.role !== 'admin').map(u => (
                      <div key={u.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-700 rounded cursor-pointer" onClick={() => toggleAllowedUser(u.id)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${editingSession.allowedUserIds?.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-500'}`}>
                          {editingSession.allowedUserIds?.includes(u.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-300">{u.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 uppercase font-bold">投票選項</label>
                  <button onClick={addOptionToSession} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                    <Plus className="w-3 h-3" /> 新增
                  </button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {editingSession.options?.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        value={opt.text}
                        onChange={e => updateOptionText(idx, e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                        placeholder="選項文字..."
                      />
                      <button onClick={() => removeOption(idx)} className="p-2 text-slate-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-800">
              <button onClick={() => setEditingSession(null)} className="px-4 py-2 text-slate-400 hover:text-white">取消</button>
              <button onClick={handleSaveSession} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-medium">儲存活動</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
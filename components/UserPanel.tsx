import React, { useState, useEffect } from 'react';
import { User, Session } from '../types';
import { LogOut, Vote, Lock, AlertCircle, CheckCircle2, User as UserIcon } from 'lucide-react';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vote' | 'profile'>('vote');

  // Profile State
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // KV 投票 state
  const [results, setResults] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');

  // 模擬載入活動 (保持原本 sessions 結構)
  const loadData = async () => {
    setLoading(true);
    // 假設從原本 fetchData 或後端取得 sessions
    // 這裡你可以保留原本邏輯
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live 更新活動
    fetchResults(); // 初次抓 KV 結果
    const resultInterval = setInterval(fetchResults, 5000); // 每 5 秒更新結果
    return () => {
      clearInterval(interval);
      clearInterval(resultInterval);
    };
  }, []);

  // ================= KV 投票 =================
  const handleVote = async (option: string) => {
    setMsg('送出中...');
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option })
      });
      if (res.ok) {
        setMsg('送出成功');
        fetchResults();
      } else {
        setMsg('送出失敗');
      }
    } catch (err) {
      setMsg('投票失敗');
    }
  };

  const fetchResults = async () => {
    try {
      const res = await fetch('/api/results');
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {}
  };
  // ==========================================

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    
    // 假設 saveUser 還在
    await fetch('/api/saveUser', { // 可自行改成原本後端 API
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, password: newPassword })
    });
    setPassMsg('密碼更新成功');
    setNewPassword('');
    setTimeout(() => setPassMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg">
             <Vote className="w-6 h-6 text-blue-500" />
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">SecureVote</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('vote')}
            className={`text-sm font-medium px-3 py-2 rounded ${activeTab === 'vote' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white'}`}
          >
            投票
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`text-sm font-medium px-3 py-2 rounded ${activeTab === 'profile' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white'}`}
          >
            帳戶
          </button>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-400 flex items-center gap-2 text-sm font-medium">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">登出</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 'vote' && (
          <div className="space-y-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">投票活動</h1>
              <p className="text-slate-400">請在下方進行投票。</p>
              {msg && <p className="text-green-400 mt-2">{msg}</p>}
            </div>

            {sessions.length === 0 && !loading && (
               <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                 <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                 <h3 className="text-slate-300 font-medium">沒有進行中的投票</h3>
               </div>
            )}

            {sessions.map(session => (
              <div key={session.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg transition-all hover:border-slate-600">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">{session.title}</h2>
                  </div>
                </div>
                
                <div className="p-6 grid gap-4 sm:grid-cols-2">
                  {session.options.map(option => (
                    <button
                      key={option.id}
                      disabled={!session.isActive}
                      onClick={() => handleVote(option.id)}
                      className="group relative flex flex-col items-start p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-blue-900/10 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{option.text}</span>
                      <div className="mt-2 text-sm text-white">
                        票數: {results[option.id] ?? 0} 票
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto">
             <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-lg">
                <div className="flex justify-center mb-6">
                   <div className="p-4 bg-slate-700 rounded-full">
                      <UserIcon className="w-12 h-12 text-slate-400" />
                   </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-white mb-2">{user.username}</h2>
                <p className="text-center text-slate-500 text-sm mb-8">角色: {user.role === 'admin' ? '管理員' : '使用者'}</p>

                <form onSubmit={handleChangePassword} className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-400 mb-1">新密碼</label>
                     <div className="relative">
                       <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                       <input 
                          type="password"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="輸入新密碼"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                     </div>
                   </div>
                   {passMsg && <p className="text-green-400 text-sm text-center">{passMsg}</p>}
                   <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors">
                      更新密碼
                   </button>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

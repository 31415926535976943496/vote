import React, { useState, useEffect } from 'react';
import { User, Session } from '../types';
import { fetchData, submitVote, saveUser } from '../services/api';
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

  const loadData = async () => {
    setLoading(true);
    const data = await fetchData();
    // Filter sessions where user is allowed
    const mySessions = data.sessions.filter(s => s.allowedUserIds.includes(user.id));
    setSessions(mySessions);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live updates
    return () => clearInterval(interval);
  }, [user.id]);

  const handleVote = async (sessionId: string, optionId: string) => {
    const success = await submitVote(sessionId, optionId, user.id);
    if (success) {
      loadData();
    } else {
      alert("投票失敗。您可能已用完票數或活動已結束。");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    
    await saveUser({ ...user, password: newPassword });
    setPassMsg('密碼更新成功');
    setNewPassword('');
    setTimeout(() => setPassMsg(''), 3000);
  };

  const getRemainingVotes = (s: Session) => s.votesPerUser - (s.userVotes[user.id] || 0);

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
              <h1 className="text-2xl font-bold text-white">進行中的活動</h1>
              <p className="text-slate-400">請在下方進行投票。</p>
            </div>

            {sessions.length === 0 && !loading && (
               <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                 <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                 <h3 className="text-slate-300 font-medium">沒有進行中的投票</h3>
                 <p className="text-slate-500 text-sm">目前沒有可供您參與的投票活動。</p>
               </div>
            )}

            {sessions.map(session => (
              <div key={session.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg transition-all hover:border-slate-600">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">{session.title}</h2>
                    <div className="flex items-center gap-4 mt-2">
                       <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${session.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                         {session.isActive ? '開放中' : '已結束'}
                       </span>
                       <span className="text-sm text-slate-400">
                         剩餘票數: <span className="text-white font-mono font-bold">{getRemainingVotes(session)}</span> / {session.votesPerUser}
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 grid gap-4 sm:grid-cols-2">
                  {session.options.map(option => (
                    <button
                      key={option.id}
                      disabled={!session.isActive || getRemainingVotes(session) <= 0}
                      onClick={() => handleVote(session.id, option.id)}
                      className="group relative flex flex-col items-start p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-blue-900/10 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{option.text}</span>
                      <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                         {/* Visual feedback of popularity without showing exact numbers if desired, or just show relative bar */}
                         <div 
                           className="h-full bg-blue-600 opacity-20 group-hover:opacity-100 transition-all" 
                           style={{width: '0%'}} // Logic to show live results could go here if user is allowed to see them
                         ></div> 
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
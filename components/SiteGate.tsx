import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { checkStartPassword } from '../services/api';

interface SiteGateProps {
  onUnlock: () => void;
}

export const SiteGate: React.FC<SiteGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const isValid = await checkStartPassword(password);
    setLoading(false);
    
    if (isValid) {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-600/20 rounded-full">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">存取受限</h1>
        <p className="text-slate-400 text-center mb-8">請輸入網站密碼以繼續。</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setError(false); setPassword(e.target.value); }}
              placeholder="網站密碼"
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-slate-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">拒絕存取。密碼無效。</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? '驗證中...' : '進入網站'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
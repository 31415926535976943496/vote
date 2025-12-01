import React, { useState, useEffect } from 'react';
import { SiteGate } from './components/SiteGate';
import { Login } from './components/Login';
import { AdminPanel } from './components/AdminPanel';
import { UserPanel } from './components/UserPanel';
import { User } from './types';

function App() {
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Persist site unlock status in session storage (not local storage)
  // so it resets when browser/tab is closed, as per high security needs
  useEffect(() => {
    const unlocked = sessionStorage.getItem('secureVoteUnlocked');
    if (unlocked === 'true') {
      setIsSiteUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsSiteUnlocked(true);
    sessionStorage.setItem('secureVoteUnlocked', 'true');
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!isSiteUnlocked) {
    return <SiteGate onUnlock={handleUnlock} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      {currentUser.role === 'admin' ? (
        <AdminPanel />
      ) : (
        <UserPanel user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
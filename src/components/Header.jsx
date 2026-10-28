import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { LogOut, Wifi, WifiOff, ShieldCheck, User } from 'lucide-react'

export default function Header({ user, role }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1>Jern Yafoor School</h1>
        <span className="brand-subtitle">Asset Management</span>
      </div>

      <div className="header-actions">
        <div className={`online-badge ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Online - Auto Sync' : 'Offline Mode'}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {user && (
          <div className="user-profile">
            <span className="role-tag">
              {role === 'admin' ? <ShieldCheck size={14} /> : <User size={14} />}
              {role === 'admin' ? 'Admin' : 'Staff'}
            </span>
            <button className="btn ghost icon-only" onClick={() => signOut(auth)} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

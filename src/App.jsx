import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { isFirebaseConfigured } from './firebaseConfig'

import Header from './components/Header'
import BottomNav from './components/BottomNav'

import Login from './pages/Login'
import Home from './pages/Home'
import Rooms from './pages/Rooms'
import RoomDetail from './pages/RoomDetail'
import Catalog from './pages/Catalog'
import Count from './pages/Count'
import Move from './pages/Move'
import Damage from './pages/Damage'
import Store from './pages/Store'
import Transfer from './pages/Transfer'
import TransferHistory from './pages/TransferHistory'
import Audit from './pages/Audit'
import Reports from './pages/Reports'
import Activity from './pages/Activity'
import Users from './pages/Users'

import { ShieldAlert } from 'lucide-react'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = checking auth
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null)
      return
    }

    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setRole(null)
        return
      }

      // Check or create Firestore user doc
      try {
        const userRef = doc(db, 'users', u.uid)
        const snap = await getDoc(userRef)

        if (snap.exists()) {
          setRole(snap.data().role || 'staff')
        } else {
          // First sign-in: create user record with default 'staff' role
          const defaultRole = 'staff'
          await setDoc(userRef, {
            email: u.email,
            role: defaultRole,
            createdAt: new Date().toISOString()
          })
          setRole(defaultRole)
        }
      } catch (err) {
        console.error('Error loading user role:', err)
        setRole('staff')
      }
    })
  }, [])

  // If Firebase keys have not been pasted yet
  if (!isFirebaseConfigured) {
    return (
      <div className="login-screen">
        <div className="login-card card">
          <div className="login-brand">
            <img src="/school-logo.png" alt="School Logo" className="login-logo" />
            <h1>Jern Yafoor School</h1>
            <p className="login-sub">Asset Tracking System</p>
          </div>

          <div className="error-banner" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <ShieldAlert size={22} />
              <span>Firebase Configuration Required</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4 }}>
              Please open <code>src/firebaseConfig.js</code> in your code editor and replace the placeholder values (<code>PASTE_HERE</code>) with your project's credentials from the <strong>Firebase Console</strong>.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (user === undefined) {
    return (
      <div className="center-screen">
        <div className="spinner"></div>
        <p>Loading Jern Yafoor Assets…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <HashRouter>
      <div className="app-shell">
        <Header user={user} role={role} />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home user={user} role={role} />} />
            <Route path="/rooms" element={<Rooms user={user} role={role} />} />
            <Route path="/rooms/:roomCode" element={<RoomDetail />} />
            <Route path="/catalog" element={<Catalog user={user} role={role} />} />
            <Route path="/count" element={<Count user={user} />} />
            <Route path="/move" element={<Move user={user} />} />
            <Route path="/damage" element={<Damage user={user} role={role} />} />
            <Route path="/store" element={<Store user={user} />} />
            <Route path="/transfer" element={<Transfer user={user} />} />
            <Route path="/transfers-history" element={<TransferHistory />} />

            {/* Admin Only Routes */}
            <Route
              path="/audit"
              element={role === 'admin' ? <Audit user={user} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/reports"
              element={role === 'admin' ? <Reports /> : <Navigate to="/" replace />}
            />
            <Route
              path="/activity"
              element={role === 'admin' ? <Activity /> : <Navigate to="/" replace />}
            />
            <Route
              path="/users"
              element={role === 'admin' ? <Users user={user} /> : <Navigate to="/" replace />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomNav role={role} />
      </div>
    </HashRouter>
  )
}

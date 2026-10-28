import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { LogIn, ShieldAlert } from 'lucide-react'

const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-not-found': 'No user account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Login failed. Please check credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card card">
        <div className="login-brand">
          <img src="/school-logo.png" alt="School Logo" className="login-logo" />
          <h1>Jern Yafoor School</h1>
          <p className="login-sub">Asset Tracking Register</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="form-field">
            <span>Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@jernyafoor.edu"
              required
              autoComplete="username"
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="error-banner">
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn primary block lg" disabled={busy}>
            <LogIn size={20} />
            <span>{busy ? 'Signing in…' : 'Sign In'}</span>
          </button>
        </form>

        <p className="login-footer">
          Authorized staff and administration access only.
        </p>
      </div>
    </div>
  )
}

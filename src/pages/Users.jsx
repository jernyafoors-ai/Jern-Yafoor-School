import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { logActivity } from '../lib/log'
import { Users as UsersIcon, ShieldCheck, User } from 'lucide-react'

export default function Users({ user: currentUser }) {
  const [usersList, setUsersList] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ uid: d.id, ...d.data() }))
      setUsersList(list)
    })
    return () => unsub()
  }, [])

  const handleRoleChange = async (targetUid, newRole, email) => {
    try {
      await updateDoc(doc(db, 'users', targetUid), {
        role: newRole,
        updatedAt: new Date().toISOString()
      })

      await logActivity(
        'CHANGE_USER_ROLE',
        { targetUid, email, newRole },
        currentUser?.email
      )

      alert(`Role for ${email} updated to ${newRole.toUpperCase()}`)
    } catch (err) {
      alert('Error updating user role: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>User Permissions & Roles</h2>
        <p className="sub-text">
          Manage system roles (Accounts created via Firebase Console)
        </p>
      </div>

      {usersList.length === 0 ? (
        <div className="empty-card card center">
          <UsersIcon size={40} className="icon-muted" />
          <p>No user records found in Firestore yet.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="users-list">
            {usersList.map((u) => (
              <li key={u.uid} className="user-item-row flex-between">
                <div>
                  <strong>{u.email}</strong>
                  <div className="sub-text">UID: {u.uid}</div>
                </div>

                <div className="flex-gap">
                  <select
                    value={u.role || 'staff'}
                    onChange={(e) => handleRoleChange(u.uid, e.target.value, u.email)}
                    className="role-select"
                  >
                    <option value="staff">Staff (Security / Field)</option>
                    <option value="admin">Admin (Operations Manager)</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

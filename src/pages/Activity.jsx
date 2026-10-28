import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase'
import { History, User, Calendar } from 'lucide-react'

export default function Activity() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'activity'), limit(100))
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''))
      setLogs(list)
    })
    return () => unsub()
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Activity Audit Log</h2>
        <p className="sub-text">Read-only history of all actions performed in the app</p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-card card center">
          <History size={40} className="icon-muted" />
          <p>No activity logs recorded yet.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="activity-list">
            {logs.map((log) => (
              <li key={log.id} className="activity-item-row flex-between">
                <div>
                  <span className="badge primary sm">{log.action}</span>
                  <div className="activity-details">
                    {JSON.stringify(log.details)}
                  </div>
                  <div className="activity-meta">
                    <span>
                      <User size={12} /> {log.userEmail || 'System'}
                    </span>
                    <span>
                      <Calendar size={12} />{' '}
                      {log.dateStr ? new Date(log.dateStr).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

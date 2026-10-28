import { useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import Scanner from '../components/Scanner'
import { logActivity } from '../lib/log'
import { ClipboardCheck, RotateCcw, AlertTriangle, CheckCircle2, Search } from 'lucide-react'

export default function Audit({ user }) {
  const [rooms, setRooms] = useState([])
  const [targetRoom, setTargetRoom] = useState('')
  const [expectedAssets, setExpectedAssets] = useState([])
  const [scannedTags, setScannedTags] = useState([])
  const [auditActive, setAuditActive] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ code: d.id, ...d.data() }))
      setRooms(list)
    })
    return () => unsub()
  }, [])

  const handleStartAudit = async () => {
    if (!targetRoom) return

    const q = query(collection(db, 'assets'), where('roomCode', '==', targetRoom))
    const snap = await getDocs(q)
    const expected = []
    snap.forEach((d) => expected.push({ tag: d.id, ...d.data() }))

    setExpectedAssets(expected)
    setScannedTags([])
    setAuditActive(true)
    setStatusMsg(`Audit started for Room ${targetRoom}. Expected assets: ${expected.length}`)
  }

  const handleScan = async (code) => {
    if (scannedTags.includes(code)) {
      setStatusMsg(`Tag #${code} already scanned in this audit session.`)
      return
    }

    setScannedTags((prev) => [...prev, code])

    // Check if tag exists in expected list
    const foundExpected = expectedAssets.some((a) => a.tag === code)
    if (foundExpected) {
      setStatusMsg(`✅ Tag #${code} matched expected inventory in ${targetRoom}`)
    } else {
      // Check if tag exists anywhere in DB
      const snap = await getDoc(doc(db, 'assets', code))
      if (snap.exists()) {
        const data = snap.data()
        setStatusMsg(`⚠️ Displaced Tag #${code} found! (Registered in ${data.roomCode || 'Unknown'})`)
      } else {
        setStatusMsg(`❓ Unregistered Tag #${code} found!`)
      }
    }
  }

  // Calculate Results
  const matchedAssets = expectedAssets.filter((a) => scannedTags.includes(a.tag))
  const missingAssets = expectedAssets.filter((a) => !scannedTags.includes(a.tag))
  const unknownOrDisplacedTags = scannedTags.filter((tag) => !expectedAssets.some((a) => a.tag === tag))

  // Move displaced item to this room
  const handleMoveToRoom = async (tag) => {
    try {
      const ref = doc(db, 'assets', tag)
      await writeBatch(db)
        .update(ref, { roomCode: targetRoom, updatedAt: new Date().toISOString() })
        .commit()

      await logActivity('AUDIT_RESOLVE_MOVE', { tag, roomCode: targetRoom }, user?.email)
      alert(`Moved #${tag} to ${targetRoom}`)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Audit & Reconciliation Mode</h2>
          <p className="sub-text">Perform physical stock-take and discover missing or displaced assets</p>
        </div>

        {auditActive && (
          <button
            className="btn outline sm"
            onClick={() => {
              setAuditActive(false)
              setScannedTags([])
              setExpectedAssets([])
            }}
          >
            <RotateCcw size={16} />
            <span>End Audit</span>
          </button>
        )}
      </div>

      {!auditActive ? (
        <div className="card audit-setup-box">
          <h3>Select Room to Audit</h3>
          <p className="sub-text">Choose the room where you are conducting the stock-take:</p>

          <div className="flex-gap mt-1">
            <select
              value={targetRoom}
              onChange={(e) => setTargetRoom(e.target.value)}
              className="flex-grow"
            >
              <option value="">-- Choose Room --</option>
              {rooms.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code} - {r.name}
                </option>
              ))}
            </select>

            <button
              className="btn primary"
              onClick={handleStartAudit}
              disabled={!targetRoom}
            >
              <ClipboardCheck size={18} />
              <span>Start Stock Audit</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="audit-active-container">
          <div className="active-room-card card flex-between">
            <div>
              <span className="room-code-tag lg">{targetRoom}</span>
              <h3>Stock Audit in Progress</h3>
              <p className="sub-text">Expected: {expectedAssets.length} | Scanned: {scannedTags.length}</p>
            </div>

            <div className="audit-stats-row flex-gap">
              <span className="badge success lg">Matched: {matchedAssets.length}</span>
              <span className="badge warning lg">Missing: {missingAssets.length}</span>
              <span className="badge danger lg">Displaced/Extra: {unknownOrDisplacedTags.length}</span>
            </div>
          </div>

          <Scanner
            onScan={handleScan}
            title={`Scan Items in ${targetRoom}`}
            placeholder="Scan asset tag during audit…"
          />

          {statusMsg && <div className="status-msg-banner card">{statusMsg}</div>}

          {/* Audit Results Reconciliation View */}
          <div className="audit-results-grid mt-1">
            {/* Missing Assets */}
            <div className="card audit-column">
              <h4 className="text-warning">
                <AlertTriangle size={18} /> Missing Assets ({missingAssets.length})
              </h4>
              <p className="sub-text">Registered in this room but NOT scanned during audit:</p>

              <ul className="audit-items-list">
                {missingAssets.length === 0 ? (
                  <p className="sub-text">None! All expected items accounted for.</p>
                ) : (
                  missingAssets.map((a) => (
                    <li key={a.tag} className="audit-item-row flex-between">
                      <div>
                        <strong>#{a.tag}</strong> — {a.catalogName || 'Asset'}
                      </div>
                      <span className="badge warning">Missing</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Displaced or Extra Assets */}
            <div className="card audit-column">
              <h4 className="text-danger">
                <Search size={18} /> Displaced / Extra Items ({unknownOrDisplacedTags.length})
              </h4>
              <p className="sub-text">Scanned here but registered elsewhere or unknown:</p>

              <ul className="audit-items-list">
                {unknownOrDisplacedTags.length === 0 ? (
                  <p className="sub-text">No displaced items found.</p>
                ) : (
                  unknownOrDisplacedTags.map((tag) => (
                    <li key={tag} className="audit-item-row flex-between">
                      <div>
                        <strong>#{tag}</strong>
                      </div>
                      <button className="btn sm primary" onClick={() => handleMoveToRoom(tag)}>
                        Move to {targetRoom}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

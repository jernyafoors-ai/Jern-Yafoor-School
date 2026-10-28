import { useState } from 'react'
import { addDoc, collection, doc, getDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import Scanner from '../components/Scanner'
import { logActivity } from '../lib/log'
import { ArrowRightLeft, RotateCcw, MapPin, CheckCircle2 } from 'lucide-react'

export default function Move({ user }) {
  const [destRoomCode, setDestRoomCode] = useState('')
  const [destRoomData, setDestRoomData] = useState(null)
  const [movesList, setMovesList] = useState([])
  const [statusMsg, setStatusMsg] = useState('')

  const handleScan = async (code) => {
    setStatusMsg('')

    // Step 1: Destination Room Selection
    if (!destRoomCode) {
      const roomSnap = await getDoc(doc(db, 'rooms', code))
      if (roomSnap.exists()) {
        setDestRoomCode(code)
        setDestRoomData(roomSnap.data())
        setStatusMsg(`Destination Room set to: ${code} (${roomSnap.data().name})`)
        return
      } else {
        setStatusMsg(`Code '${code}' is not a valid room code. Please scan a destination room QR code first.`)
        return
      }
    }

    // Step 2: Asset Movement
    try {
      const assetRef = doc(db, 'assets', code)
      const assetSnap = await getDoc(assetRef)

      if (!assetSnap.exists()) {
        setStatusMsg(`Tag #${code} is not registered in the system. Please use Count mode to register new tags first.`)
        return
      }

      const asset = assetSnap.data()
      const fromRoom = asset.roomCode || 'Unassigned'

      if (fromRoom === destRoomCode) {
        setStatusMsg(`Asset #${code} is ALREADY in room ${destRoomCode}.`)
        return
      }

      // Perform batched write: Update asset roomCode & add movement record
      const batch = writeBatch(db)

      batch.update(assetRef, {
        roomCode: destRoomCode,
        updatedAt: new Date().toISOString()
      })

      const movementRef = doc(collection(db, 'movements'))
      batch.set(movementRef, {
        tag: code,
        catalogName: asset.catalogName || 'Asset',
        fromRoom: fromRoom,
        toRoom: destRoomCode,
        by: user?.email || 'staff',
        at: new Date().toISOString()
      })

      await batch.commit()

      await logActivity(
        'MOVE_ASSET',
        { tag: code, fromRoom, toRoom: destRoomCode },
        user?.email
      )

      const moveItem = {
        tag: code,
        catalogName: asset.catalogName || 'Asset',
        fromRoom: fromRoom,
        toRoom: destRoomCode,
        time: new Date().toLocaleTimeString()
      }

      setMovesList((prev) => [moveItem, ...prev])
      setStatusMsg(`✅ Moved #${code} (${asset.catalogName || 'Asset'}) from ${fromRoom} ➔ ${destRoomCode}`)
    } catch (err) {
      alert('Error moving asset: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Shifting Mode (Move)</h2>
          <p className="sub-text">Scan destination room QR first, then scan items to move them</p>
        </div>

        {destRoomCode && (
          <button
            className="btn outline sm"
            onClick={() => {
              setDestRoomCode('')
              setDestRoomData(null)
              setMovesList([])
            }}
          >
            <RotateCcw size={16} />
            <span>Change Room</span>
          </button>
        )}
      </div>

      {/* Destination Room Display */}
      {!destRoomCode ? (
        <div className="notice-banner card warning-border">
          <MapPin size={24} className="icon-warning" />
          <div>
            <h4>Step 1: Scan Destination Room QR</h4>
            <p>Scan the QR label of the room where you are moving items TO.</p>
          </div>
        </div>
      ) : (
        <div className="active-room-card card flex-between">
          <div>
            <span className="room-code-tag lg">{destRoomCode}</span>
            3<h3>{destRoomData?.name || 'Destination Room'}</h3>
            <p className="sub-text">Items scanned below will move TO this room</p>
          </div>

          <div className="count-badge-lg card">
            <span className="count-number">{movesList.length}</span>
            <span className="count-label">Moved</span>
          </div>
        </div>
      )}

      {/* Scanner */}
      <Scanner
        onScan={handleScan}
        title={destRoomCode ? `Scan Items to Move into ${destRoomCode}` : 'Scan Destination Room QR'}
        placeholder={destRoomCode ? 'Scan asset barcode tag…' : 'Scan Destination Room QR (e.g. OB-GF-001)…'}
      />

      {statusMsg && <div className="status-msg-banner card">{statusMsg}</div>}

      {/* Moved Items History List */}
      {movesList.length > 0 && (
        <div className="session-list card">
          <h3>Moved in this session ({movesList.length})</h3>
          <ul className="moves-history-list">
            {movesList.map((m, idx) => (
              <li key={idx} className="move-item-row flex-between">
                <div>
                  <strong>#{m.tag}</strong> ({m.catalogName})
                  <div className="move-route">
                    <span className="from-tag">{m.fromRoom}</span>
                    <ArrowRightLeft size={14} className="icon-accent" />
                    <span className="to-tag">{m.toRoom}</span>
                  </div>
                </div>
                <span className="sub-text">{m.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

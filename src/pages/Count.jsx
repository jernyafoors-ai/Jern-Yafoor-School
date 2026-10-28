import { useEffect, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Scanner from '../components/Scanner'
import { logActivity } from '../lib/log'
import { ListOrdered, CheckCircle2, RotateCcw, PackageCheck } from 'lucide-react'

export default function Count({ user }) {
  const [roomCode, setRoomCode] = useState('')
  const [roomData, setRoomData] = useState(null)
  const [catalogList, setCatalogList] = useState([])
  const [selectedCatalogId, setSelectedCatalogId] = useState('')
  const [lastUsedCatalogId, setLastUsedCatalogId] = useState('')

  const [currentTag, setCurrentTag] = useState('')
  const [sessionCount, setSessionCount] = useState([])
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    // Fetch Catalog List
    const unsub = onSnapshot(collection(db, 'catalog'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      list.sort((a, b) => a.name.localeCompare(b.name))
      setCatalogList(list)
      if (list.length > 0 && !selectedCatalogId) {
        setSelectedCatalogId(list[0].id)
      }
    })
    return () => unsub()
  }, [])

  // Handle scanned code
  const handleScan = async (code) => {
    setStatusMsg('')

    // Step 1: If room code is not set, check if scanned code is a room code
    if (!roomCode) {
      const roomSnap = await getDoc(doc(db, 'rooms', code))
      if (roomSnap.exists()) {
        setRoomCode(code)
        setRoomData(roomSnap.data())
        setStatusMsg(`Active Room set to: ${code} (${roomSnap.data().name})`)
        return
      } else {
        setStatusMsg(`Code '${code}' is not a valid room code. Please scan a room QR code first.`)
        return
      }
    }

    // Step 2: Asset barcode tag scanned
    setCurrentTag(code)

    // Check if asset already exists in Firestore
    const assetSnap = await getDoc(doc(db, 'assets', code))

    if (assetSnap.exists()) {
      // Asset already exists -> Update room to current room if different
      const existing = assetSnap.data()
      await setDoc(
        doc(db, 'assets', code),
        {
          roomCode: roomCode,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      )

      const catName = catalogList.find((c) => c.id === existing.catalogId)?.name || 'Asset'
      setSessionCount((prev) => [{ tag: code, catalogName: catName, isNew: false }, ...prev])
      setStatusMsg(`Tag ${code} confirmed in ${roomCode} (Previously: ${existing.roomCode || 'Unassigned'})`)
      setCurrentTag('')
    } else {
      // New tag -> needs catalog assignment (user can select or auto-use last/shortcut)
      setStatusMsg(`New tag ${code} detected. Select catalog type below to register.`)
    }
  }

  // Register New Asset
  const handleRegisterNewAsset = async (catalogId) => {
    if (!currentTag || !roomCode || !catalogId) return

    const catObj = catalogList.find((c) => c.id === catalogId)

    try {
      await setDoc(doc(db, 'assets', currentTag), {
        tag: currentTag,
        catalogId: catalogId,
        catalogName: catObj?.name || 'Asset',
        roomCode: roomCode,
        status: 'ok',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      await logActivity(
        'REGISTER_ASSET',
        { tag: currentTag, roomCode, catalogId, catalogName: catObj?.name },
        user?.email
      )

      setSessionCount((prev) => [
        { tag: currentTag, catalogName: catObj?.name || 'Asset', isNew: true },
        ...prev
      ])
      setLastUsedCatalogId(catalogId)
      setStatusMsg(`Tag ${currentTag} registered as ${catObj?.name} in ${roomCode}`)
      setCurrentTag('')
    } catch (err) {
      alert('Failed to register asset: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>First-Time Count</h2>
          <p className="sub-text">Scan room QR first, then scan all ADEC tags</p>
        </div>

        {roomCode && (
          <button
            className="btn outline sm"
            onClick={() => {
              setRoomCode('')
              setRoomData(null)
              setCurrentTag('')
              setSessionCount([])
            }}
          >
            <RotateCcw size={16} />
            <span>Change Room</span>
          </button>
        )}
      </div>

      {/* Active Room Header */}
      {!roomCode ? (
        <div className="notice-banner card warning-border">
          <ListOrdered size={24} className="icon-warning" />
          <div>
            <h4>Step 1: Scan Room QR Code</h4>
            <p>Scan the room's QR label (e.g. OB-GF-001) to begin counting in that room.</p>
          </div>
        </div>
      ) : (
        <div className="active-room-card card flex-between">
          <div>
            <span className="room-code-tag lg">{roomCode}</span>
            <h3>{roomData?.name || 'Room'}</h3>
            <p className="sub-text">Active Room for Counting</p>
          </div>

          <div className="count-badge-lg card">
            <span className="count-number">{sessionCount.length}</span>
            <span className="count-label">Scanned</span>
          </div>
        </div>
      )}

      {/* Scanner Component */}
      <Scanner
        onScan={handleScan}
        title={roomCode ? `Scan ADEC Tags in ${roomCode}` : 'Scan Room QR Code'}
        placeholder={roomCode ? 'Scan ADEC tag…' : 'Scan Room QR (e.g. OB-GF-001)…'}
      />

      {statusMsg && <div className="status-msg-banner card">{statusMsg}</div>}

      {/* Register New Tag Modal / Box */}
      {currentTag && (
        <div className="card new-asset-box">
          <h4>Register New Tag #{currentTag}</h4>
          <p className="sub-text">Choose the item type from the catalog:</p>

          <label className="form-field">
            <span>Asset Catalog Type</span>
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
            >
              {catalogList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category || 'Furniture'})
                </option>
              ))}
            </select>
          </label>

          <div className="action-buttons flex-gap mt-1">
            <button
              type="button"
              className="btn primary flex-grow"
              onClick={() => handleRegisterNewAsset(selectedCatalogId)}
            >
              <PackageCheck size={18} />
              <span>Register This Item</span>
            </button>

            {lastUsedCatalogId && (
              <button
                type="button"
                className="btn outline"
                onClick={() => handleRegisterNewAsset(lastUsedCatalogId)}
                title="Use same item type as previous scan"
              >
                <span>⚡ Same as Previous</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Session List */}
      {sessionCount.length > 0 && (
        <div className="session-list card">
          <h3>Room Count Progress ({sessionCount.length})</h3>
          <ul className="count-items-list">
            {sessionCount.map((item, idx) => (
              <li key={idx} className="count-item flex-between">
                <div>
                  <strong>#{item.tag}</strong> — {item.catalogName}
                </div>
                {item.isNew ? (
                  <span className="badge success">Registered</span>
                ) : (
                  <span className="badge info">Confirmed</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

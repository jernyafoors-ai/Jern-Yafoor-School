import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import Scanner from '../components/Scanner'
import { generateTransferPDF } from '../lib/pdf'
import { logActivity } from '../lib/log'
import { Truck, Plus, Trash2, FileText, CheckCircle2 } from 'lucide-react'

export default function Transfer({ user }) {
  const [items, setItems] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [catalogMap, setCatalogMap] = useState({})

  // Form Fields
  const [carriedBy, setCarriedBy] = useState('')
  const [authorizedBy, setAuthorizedBy] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [destinationSite, setDestinationSite] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Rooms List
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ code: d.id, ...d.data() }))
      setRooms(list)
    })

    // Catalog Map
    const unsubCat = onSnapshot(collection(db, 'catalog'), (snap) => {
      const map = {}
      snap.forEach((d) => (map[d.id] = { id: d.id, ...d.data() }))
      setCatalogMap(map)
    })

    return () => {
      unsubRooms()
      unsubCat()
    }
  }, [])

  // Scan individual tag to add
  const handleScan = async (code) => {
    setStatusMsg('')

    if (items.some((i) => i.tag === code)) {
      setStatusMsg(`Tag #${code} is already added to transfer list.`)
      return
    }

    const snap = await getDoc(doc(db, 'assets', code))
    if (!snap.exists()) {
      setStatusMsg(`Tag #${code} is not registered in system.`)
      return
    }

    const data = { tag: snap.id, ...snap.data() }
    if (data.status === 'out') {
      setStatusMsg(`Tag #${code} is ALREADY marked as transferred out.`)
      return
    }

    setItems((prev) => [...prev, data])
    setStatusMsg(`Added #${code} (${data.catalogName || 'Asset'}) to transfer list`)
  }

  // "Select whole room" button: Adds every asset in that room
  const handleAddWholeRoom = async () => {
    if (!selectedRoom) return

    const q = query(collection(db, 'assets'), where('roomCode', '==', selectedRoom))
    const snap = await getDocs(q)

    let addedCount = 0
    const newItems = [...items]

    snap.forEach((d) => {
      const data = { tag: d.id, ...d.data() }
      if (data.status !== 'out' && !newItems.some((i) => i.tag === d.id)) {
        newItems.push(data)
        addedCount++
      }
    })

    setItems(newItems)
    setStatusMsg(`Added ${addedCount} items from Room ${selectedRoom}`)
  }

  const handleRemoveItem = (tag) => {
    setItems((prev) => prev.filter((i) => i.tag !== tag))
  }

  // Execute Transfer Out
  const handleSubmitTransfer = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      alert('Please add at least one asset to the transfer list.')
      return
    }

    setBusy(true)

    try {
      const transferId = 'TRF-' + Date.now().toString().slice(-6)
      const transferData = {
        id: transferId,
        carriedBy: carriedBy.trim(),
        authorizedBy: authorizedBy.trim(),
        receivedBy: receivedBy.trim(),
        vehicleNo: vehicleNo.trim(),
        destinationSite: destinationSite.trim(),
        itemCount: items.length,
        itemsSnapshot: items.map((i) => ({
          tag: i.tag,
          catalogId: i.catalogId || '',
          catalogName: i.catalogName || '',
          fromRoom: i.roomCode || 'Unassigned'
        })),
        createdAt: new Date().toLocaleString(),
        timestamp: new Date().toISOString(),
        createdBy: user?.email || 'staff'
      }

      const batch = writeBatch(db)

      // 1. Create Transfer Document
      const transferRef = doc(db, 'transfers', transferId)
      batch.set(transferRef, transferData)

      // 2. Mark Assets as status = 'out'
      items.forEach((item) => {
        const assetRef = doc(db, 'assets', item.tag)
        batch.update(assetRef, {
          status: 'out',
          updatedAt: new Date().toISOString()
        })
      })

      await batch.commit()

      await logActivity(
        'EXECUTE_TRANSFER_OUT',
        { transferId, itemCount: items.length, destinationSite },
        user?.email
      )

      // Generate & Download PDF
      await generateTransferPDF(transferData, items, catalogMap)

      alert(`Transfer ${transferId} created successfully! Form PDF downloaded.`)

      // Reset
      setItems([])
      setCarriedBy('')
      setAuthorizedBy('')
      setReceivedBy('')
      setVehicleNo('')
      setDestinationSite('')
      setStatusMsg('')
    } catch (err) {
      alert('Error saving transfer: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Asset Transfer Out Form</h2>
        <p className="sub-text">Record assets leaving the school grounds & generate official PDF form</p>
      </div>

      <div className="transfer-grid">
        {/* Left Column: Asset Selection */}
        <div className="selection-column">
          <Scanner
            onScan={handleScan}
            title="1. Add Assets by Scanning"
            placeholder="Scan asset barcode tag to add…"
          />

          <div className="card whole-room-card mt-1">
            <h4>Or Add All Assets From a Room</h4>
            <div className="flex-gap mt-1">
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="flex-grow"
              >
                <option value="">-- Select Room --</option>
                {rooms.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} - {r.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn outline sm"
                onClick={handleAddWholeRoom}
                disabled={!selectedRoom}
              >
                <Plus size={16} />
                <span>Add Whole Room</span>
              </button>
            </div>
          </div>

          {statusMsg && <div className="status-msg-banner card">{statusMsg}</div>}

          {/* Selected Items List */}
          <div className="card items-list-box mt-1">
            <h3>Selected Items ({items.length})</h3>
            {items.length === 0 ? (
              <p className="sub-text center">No items added to transfer list yet.</p>
            ) : (
              <ul className="transfer-items-list">
                {items.map((item) => (
                  <li key={item.tag} className="flex-between transfer-item-row">
                    <div>
                      <strong>#{item.tag}</strong> — {item.catalogName || 'Asset'}
                      <div className="sub-text">From Room: {item.roomCode || 'N/A'}</div>
                    </div>
                    <button
                      className="btn danger sm icon-only"
                      onClick={() => handleRemoveItem(item.tag)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Transfer Form Details */}
        <div className="form-column">
          <form onSubmit={handleSubmitTransfer} className="card form-grid">
            <h3>2. Transfer Form Details</h3>

            <label className="form-field">
              <span>Destination Site / School Name</span>
              <input
                type="text"
                value={destinationSite}
                onChange={(e) => setDestinationSite(e.target.value)}
                placeholder="e.g. Al Ain Branch, Storage Facility"
                required
              />
            </label>

            <label className="form-field">
              <span>Carried By (Full Name)</span>
              <input
                type="text"
                value={carriedBy}
                onChange={(e) => setCarriedBy(e.target.value)}
                placeholder="Name of driver / transport person"
                required
              />
            </label>

            <label className="form-field">
              <span>Authorized By (Full Name)</span>
              <input
                type="text"
                value={authorizedBy}
                onChange={(e) => setAuthorizedBy(e.target.value)}
                placeholder="Name of Operations Manager"
                required
              />
            </label>

            <label className="form-field">
              <span>Received By (Full Name)</span>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Name of receiving person at destination"
                required
              />
            </label>

            <label className="form-field">
              <span>Vehicle Number</span>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="e.g. Abu Dhabi 12345"
                required
              />
            </label>

            <button
              type="submit"
              className="btn primary lg block mt-1"
              disabled={busy || items.length === 0}
            >
              <FileText size={20} />
              <span>{busy ? 'Generating Form…' : 'Confirm & Download PDF Form'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

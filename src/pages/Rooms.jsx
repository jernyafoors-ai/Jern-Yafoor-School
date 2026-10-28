import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import {
  BUILDINGS,
  FLOORS,
  ROOM_TYPES,
  formatRoomCode,
  suggestNextNumber
} from '../lib/roomCode'
import { generateAllRoomLabelsPDF, generateRoomLabelPDF } from '../lib/pdf'
import { logActivity } from '../lib/log'
import { DoorOpen, Plus, Printer, Edit2, ChevronRight, QrCode } from 'lucide-react'

export default function Rooms({ user, role }) {
  const [rooms, setRooms] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)

  // Form State
  const [building, setBuilding] = useState('OB')
  const [floor, setFloor] = useState('GF')
  const [number, setNumber] = useState('001')
  const [name, setName] = useState('')
  const [type, setType] = useState('classroom')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ code: d.id, ...d.data() }))
      list.sort((a, b) => a.code.localeCompare(b.code))
      setRooms(list)
    })
    return () => unsub()
  }, [])

  // Auto-suggest room number when building or floor changes
  useEffect(() => {
    const existingCodes = rooms.map((r) => r.code)
    const nextNum = suggestNextNumber(existingCodes, building, floor)
    setNumber(nextNum)
  }, [building, floor, rooms])

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    const code = formatRoomCode(building, floor, number)

    try {
      await setDoc(doc(db, 'rooms', code), {
        code,
        name: name.trim() || `Room ${number}`,
        type,
        building,
        floor,
        createdAt: new Date().toISOString()
      })

      await logActivity('CREATE_ROOM', { code, name, building, floor }, user?.email)
      setShowAddModal(false)
      setName('')
    } catch (err) {
      alert('Error creating room: ' + err.message)
    }
  }

  const handleUpdateRoomName = async (e) => {
    e.preventDefault()
    if (!editingRoom) return

    try {
      await updateDoc(doc(db, 'rooms', editingRoom.code), {
        name: name.trim()
      })

      await logActivity('UPDATE_ROOM_NAME', { code: editingRoom.code, newName: name }, user?.email)
      setEditingRoom(null)
      setName('')
    } catch (err) {
      alert('Error updating room name: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Rooms & QR Labels</h2>
          <p className="sub-text">Total Rooms: {rooms.length}</p>
        </div>

        <div className="flex-gap">
          {rooms.length > 0 && (
            <button className="btn outline sm" onClick={() => generateAllRoomLabelsPDF(rooms)}>
              <Printer size={16} />
              <span>Print All Labels</span>
            </button>
          )}

          <button className="btn primary sm" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            <span>Add Room</span>
          </button>
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="form-grid">
              <label className="form-field">
                <span>Building</span>
                <select value={building} onChange={(e) => setBuilding(e.target.value)}>
                  {BUILDINGS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Floor</span>
                <select value={floor} onChange={(e) => setFloor(e.target.value)}>
                  {FLOORS.map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Room Number (Auto-Suggested)</span>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                />
              </label>

              <div className="code-preview-box">
                Generated Code: <strong>{formatRoomCode(building, floor, number)}</strong>
              </div>

              <label className="form-field">
                <span>Room Name / Designation</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Class 12A or Science Lab"
                  required
                />
              </label>

              <label className="form-field">
                <span>Room Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {ROOM_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions flex-end">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Name Modal */}
      {editingRoom && (
        <div className="modal-overlay" onClick={() => setEditingRoom(null)}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Name for {editingRoom.code}</h3>
            <p className="help-text">
              Code <strong>{editingRoom.code}</strong> remains fixed forever. Only the room name changes.
            </p>
            <form onSubmit={handleUpdateRoomName} className="form-grid">
              <label className="form-field">
                <span>New Room Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <div className="modal-actions flex-end">
                <button type="button" className="btn ghost" onClick={() => setEditingRoom(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Cards List */}
      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <div className="empty-card card center">
            <DoorOpen size={40} className="icon-muted" />
            <p>No rooms registered yet. Click "Add Room" to create the first room.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.code} className="room-card card">
              <div className="room-card-header flex-between">
                <div>
                  <span className="room-code-tag">{room.code}</span>
                  <h4 className="room-name">{room.name}</h4>
                  <span className="room-meta">
                    {room.building} • {room.floor} • {room.type}
                  </span>
                </div>

                <button
                  className="btn icon-only ghost"
                  onClick={() => {
                    setEditingRoom(room)
                    setName(room.name)
                  }}
                  title="Edit Room Name"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <div className="room-card-actions flex-between">
                <button
                  className="btn outline sm"
                  onClick={() => generateRoomLabelPDF(room)}
                  title="Print Label PDF"
                >
                  <Printer size={14} />
                  <span>Print QR Label</span>
                </button>

                <Link to={`/rooms/${room.code}`} className="btn ghost sm">
                  <span>View Assets</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Scanner from '../components/Scanner'
import PhotoPicker from '../components/PhotoPicker'
import AssetCard from '../components/AssetCard'
import { logActivity } from '../lib/log'
import { AlertTriangle, Wrench, CheckCircle, ShieldAlert } from 'lucide-react'

export default function Damage({ user, role }) {
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [status, setStatus] = useState('damaged')
  const [note, setNote] = useState('')
  const [damagePhoto, setDamagePhoto] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const handleScan = async (code) => {
    setStatusMsg('')
    const ref = doc(db, 'assets', code)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      setStatusMsg(`Tag #${code} is not registered in the system.`)
      setSelectedAsset(null)
      return
    }

    const data = { tag: snap.id, ...snap.data() }
    setSelectedAsset(data)
    setStatus(data.status || 'damaged')
    setNote(data.note || '')
    setDamagePhoto(data.photo || '')
  }

  const handleSaveReport = async (e) => {
    e.preventDefault()
    if (!selectedAsset) return

    if (status === 'written_off' && role !== 'admin') {
      alert('Only administrators can write off assets.')
      return
    }

    try {
      await updateDoc(doc(db, 'assets', selectedAsset.tag), {
        status: status,
        note: note.trim(),
        photo: damagePhoto || selectedAsset.photo || '',
        updatedAt: new Date().toISOString()
      })

      await logActivity(
        'UPDATE_DAMAGE_STATUS',
        { tag: selectedAsset.tag, status, note },
        user?.email
      )

      setStatusMsg(`Status for Asset #${selectedAsset.tag} updated to '${status.toUpperCase()}'`)
      setSelectedAsset(null)
      setNote('')
      setDamagePhoto('')
    } catch (err) {
      alert('Error updating damage report: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Damage & Repair Management</h2>
        <p className="sub-text">Scan asset tag to report damage, send for repair, or return to service</p>
      </div>

      <Scanner
        onScan={handleScan}
        title="Scan Damaged or Repaired Asset"
        placeholder="Scan asset barcode tag…"
      />

      {statusMsg && <div className="status-msg-banner card">{statusMsg}</div>}

      {/* Selected Asset Damage Form */}
      {selectedAsset && (
        <div className="card damage-form-card">
          <h3>Asset Details: #{selectedAsset.tag}</h3>
          <AssetCard asset={selectedAsset} />

          <form onSubmit={handleSaveReport} className="form-grid mt-1">
            <label className="form-field">
              <span>Status Flow</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="damaged">⚠️ Damaged (Needs Repair / Inspection)</option>
                <option value="in_repair">🔧 In Repair (Sent to Workshop)</option>
                <option value="ok">✅ OK / Repaired (Back in Service)</option>
                {role === 'admin' && (
                  <option value="written_off">❌ Written Off (Beyond Repair - Admin Only)</option>
                )}
              </select>
            </label>

            <label className="form-field">
              <span>Damage / Repair Note</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe broken part, repair details, or condition…"
                rows={3}
              />
            </label>

            <PhotoPicker
              value={damagePhoto}
              onChange={(url) => setDamagePhoto(url)}
              label="Specific Damage Photo (Optional)"
            />

            <div className="action-buttons flex-end">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setSelectedAsset(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Save Status Update
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { collection, doc, getDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import Scanner from '../components/Scanner'
import { logActivity } from '../lib/log'
import { Warehouse, RefreshCw, CheckCircle2, ArrowRightLeft } from 'lucide-react'

export default function Store({ user }) {
  const [storeRooms, setStoreRooms] = useState([])
  const [activeTab, setActiveTab] = useState('stock') // 'stock' or 'replacement'

  // Replacement Flow State
  const [brokenTag, setBrokenTag] = useState('')
  const [brokenAsset, setBrokenAsset] = useState(null)
  const [newTag, setNewTag] = useState('')
  const [newAsset, setNewAsset] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    // Fetch rooms of type 'store'
    const q = query(collection(db, 'rooms'), where('type', '==', 'store'))
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ code: d.id, ...d.data() }))
      setStoreRooms(list)
    })
    return () => unsub()
  }, [])

  // Broken Tag Scan / Input
  const handleScanBroken = async (code) => {
    const snap = await getDoc(doc(db, 'assets', code))
    if (!snap.exists()) {
      setStatusMsg(`Broken Tag #${code} not found in system.`)
      return
    }
    setBrokenTag(code)
    setBrokenAsset({ tag: snap.id, ...snap.data() })
    setStatusMsg(`Selected Broken Asset #${code} (in ${snap.data().roomCode})`)
  }

  // Replacement Tag Scan / Input
  const handleScanNew = async (code) => {
    const snap = await getDoc(doc(db, 'assets', code))
    if (!snap.exists()) {
      setStatusMsg(`Replacement Tag #${code} not found in system.`)
      return
    }
    setNewTag(code)
    setNewAsset({ tag: snap.id, ...snap.data() })
    setStatusMsg(`Selected Replacement Asset #${code}`)
  }

  // Execute Replacement
  const handleExecuteReplacement = async () => {
    if (!brokenAsset || !newAsset) return

    const targetRoom = brokenAsset.roomCode || 'Unassigned'

    try {
      const batch = writeBatch(db)

      // 1. Mark broken asset as damaged
      const brokenRef = doc(db, 'assets', brokenAsset.tag)
      batch.update(brokenRef, {
        status: 'damaged',
        replacedBy: newAsset.tag,
        updatedAt: new Date().toISOString()
      })

      // 2. Move new asset into broken asset's room
      const newRef = doc(db, 'assets', newAsset.tag)
      batch.update(newRef, {
        roomCode: targetRoom,
        replaces: brokenAsset.tag,
        updatedAt: new Date().toISOString()
      })

      // 3. Record movement
      const moveRef = doc(collection(db, 'movements'))
      batch.set(moveRef, {
        tag: newAsset.tag,
        catalogName: newAsset.catalogName || 'Asset',
        fromRoom: newAsset.roomCode || 'Store',
        toRoom: targetRoom,
        by: user?.email || 'staff',
        at: new Date().toISOString(),
        note: `Replaced broken asset #${brokenAsset.tag}`
      })

      await batch.commit()

      await logActivity(
        'EXECUTE_REPLACEMENT',
        { brokenTag: brokenAsset.tag, newTag: newAsset.tag, targetRoom },
        user?.email
      )

      setStatusMsg(
        `✅ Success! Broken Asset #${brokenAsset.tag} marked as damaged. Replacement Asset #${newAsset.tag} moved to ${targetRoom}.`
      )

      setBrokenTag('')
      setBrokenAsset(null)
      setNewTag('')
      setNewAsset(null)
    } catch (err) {
      alert('Error carrying out replacement: ' + err.message)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Store & Stock Replacements</h2>
        <p className="sub-text">
          Manage central store room inventory & replace broken classroom items
        </p>
      </div>

      <div className="tab-bar card">
        <button
          className={activeTab === 'replacement' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('replacement')}
        >
          <RefreshCw size={18} />
          <span>Item Replacement Flow</span>
        </button>
      </div>

      {statusMsg && <div className="status-msg-banner card">{statusMsg}</div>}

      {/* Item Replacement Flow */}
      {activeTab === 'replacement' && (
        <div className="replacement-container card">
          <h3>Replace Damaged / Broken Asset</h3>
          <p className="sub-text">
            Links the broken asset and replacement asset. The new asset automatically moves to
            the classroom, keeping total room count balanced.
          </p>

          <div className="replacement-grid">
            {/* Step 1: Broken Asset */}
            <div className="replacement-box card">
              <h4>1. Select Broken Asset</h4>
              {!brokenAsset ? (
                <Scanner
                  onScan={handleScanBroken}
                  title="Scan Broken Asset"
                  placeholder="Scan broken item tag…"
                />
              ) : (
                <div className="selected-tag-info">
                  <p>
                    <strong>Tag:</strong> #{brokenAsset.tag}
                  </p>
                  <p>
                    <strong>Type:</strong> {brokenAsset.catalogName}
                  </p>
                  <p>
                    <strong>Current Room:</strong> {brokenAsset.roomCode}
                  </p>
                  <button className="btn outline sm mt-1" onClick={() => setBrokenAsset(null)}>
                    Change Broken Asset
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Replacement Asset */}
            <div className="replacement-box card">
              <h4>2. Select New / Store Asset</h4>
              {!newAsset ? (
                <Scanner
                  onScan={handleScanNew}
                  title="Scan Replacement Asset"
                  placeholder="Scan replacement item tag…"
                />
              ) : (
                <div className="selected-tag-info">
                  <p>
                    <strong>Tag:</strong> #{newAsset.tag}
                  </p>
                  <p>
                    <strong>Type:</strong> {newAsset.catalogName}
                  </p>
                  <p>
                    <strong>Source Room:</strong> {newAsset.roomCode || 'Store'}
                  </p>
                  <button className="btn outline sm mt-1" onClick={() => setNewAsset(null)}>
                    Change Replacement Asset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Execute Button */}
          {brokenAsset && newAsset && (
            <div className="confirm-replacement-box card center mt-1">
              <h4>Confirm Replacement</h4>
              <p>
                Asset <strong>#{newAsset.tag}</strong> will replace Asset{' '}
                <strong>#{brokenAsset.tag}</strong> in room{' '}
                <strong>{brokenAsset.roomCode}</strong>.
              </p>
              <button className="btn primary lg block mt-1" onClick={handleExecuteReplacement}>
                <CheckCircle2 size={20} />
                <span>Confirm & Swap Asset</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

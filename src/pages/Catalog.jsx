import { useEffect, useState } from 'react'
import { addDoc, collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import PhotoPicker from '../components/PhotoPicker'
import { logActivity } from '../lib/log'
import { Boxes, Plus, Search, Edit2, Package } from 'lucide-react'

export default function Catalog({ user, role }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Form
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Furniture')
  const [photo, setPhoto] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'catalog'), (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      list.sort((a, b) => a.name.localeCompare(b.name))
      setItems(list)
    })
    return () => unsub()
  }, [])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setName('')
    setCategory('Furniture')
    setPhoto('')
    setShowModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setName(item.name)
    setCategory(item.category || 'Furniture')
    setPhoto(item.photo || '')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'catalog', editingItem.id), {
          name: name.trim(),
          category,
          photo,
          updatedAt: new Date().toISOString()
        })
        await logActivity('UPDATE_CATALOG_ITEM', { id: editingItem.id, name }, user?.email)
      } else {
        await addDoc(collection(db, 'catalog'), {
          name: name.trim(),
          category,
          photo,
          createdAt: new Date().toISOString()
        })
        await logActivity('CREATE_CATALOG_ITEM', { name, category }, user?.email)
      }

      setShowModal(false)
    } catch (err) {
      alert('Error saving catalog item: ' + err.message)
    }
  }

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Asset Catalog</h2>
          <p className="sub-text">Standard types of assets in school: {items.length}</p>
        </div>

        <button className="btn primary sm" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Catalog Item</span>
        </button>
      </div>

      <div className="search-box card">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search catalog items or categories…"
        />
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
            <h3>{editingItem ? 'Edit Catalog Item' : 'Create Catalog Item'}</h3>

            <form onSubmit={handleSave} className="form-grid">
              <label className="form-field">
                <span>Item Name (e.g. Wooden Student Chair)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Plastic Arm Chair, Teacher Desk"
                  required
                />
              </label>

              <label className="form-field">
                <span>Category</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Furniture">Furniture</option>
                  <option value="Electronics">Electronics / IT</option>
                  <option value="Lab Equipment">Lab Equipment</option>
                  <option value="Sports">Sports Equipment</option>
                  <option value="Music">Music Instruments</option>
                  <option value="Medical">Medical / Clinic</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <PhotoPicker
                value={photo}
                onChange={(dataUrl) => setPhoto(dataUrl)}
                label="Sample Catalog Photo (Shared for all items of this type)"
              />

              <div className="modal-actions flex-end">
                <button type="button" className="btn ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save Catalog Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="catalog-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-card card center">
            <Boxes size={40} className="icon-muted" />
            <p>No catalog items found. Click "Add Catalog Item" to add one.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="catalog-card card flex-row">
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="asset-thumb" />
              ) : (
                <div className="asset-thumb-placeholder">
                  <Package size={24} />
                </div>
              )}

              <div className="catalog-info flex-grow">
                <h4>{item.name}</h4>
                <span className="badge neutral">{item.category || 'Furniture'}</span>
              </div>

              <button
                className="btn icon-only ghost"
                onClick={() => handleOpenEdit(item)}
                title="Edit Item"
              >
                <Edit2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

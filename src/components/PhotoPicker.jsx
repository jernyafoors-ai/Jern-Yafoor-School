import { useState } from 'react'
import { processPhoto } from '../lib/image'
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react'

export default function PhotoPicker({ value, onChange, label = 'Photo' }) {
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const dataUrl = await processPhoto(file)
      onChange(dataUrl)
    } catch (err) {
      alert('Could not process photo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="photo-picker-box">
      <span className="picker-label">{label}</span>

      {value ? (
        <div className="photo-preview-container">
          <img src={value} alt="Preview" className="photo-preview" />
          <button type="button" className="btn danger sm icon-only remove-btn" onClick={handleRemove}>
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label className="photo-upload-btn btn outline">
          {loading ? (
            <span>Compressing photo…</span>
          ) : (
            <>
              <Camera size={18} />
              <span>Take Photo / Choose Image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  )
}

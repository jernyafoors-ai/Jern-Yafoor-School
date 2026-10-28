import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { isDuplicateScan, playSuccessBeep } from '../lib/scan'
import { Camera, Keyboard, CheckCircle, RefreshCw } from 'lucide-react'

export default function Scanner({ onScan, placeholder = 'Scan or enter barcode tag…', title = 'Barcode / QR Scanner' }) {
  const [manualInput, setManualInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [recentList, setRecentList] = useState([])
  const inputRef = useRef(null)
  const scannerRef = useRef(null)

  // Keep input focused for physical hardware barcode scanners
  useEffect(() => {
    if (!cameraActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [cameraActive, recentList])

  // Handle scanned code (from camera or physical scanner)
  const handleCode = (code) => {
    if (!code) return
    const cleanCode = code.trim()
    if (!cleanCode) return

    if (isDuplicateScan(cleanCode)) {
      return
    }

    playSuccessBeep()
    setRecentList((prev) => [cleanCode, ...prev.slice(0, 9)])
    onScan(cleanCode)
    setManualInput('')
  }

  // Handle hardware scanner / manual submit
  const handleManualSubmit = (e) => {
    e.preventDefault()
    handleCode(manualInput)
  }

  // Camera scanner setup
  useEffect(() => {
    if (cameraActive) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      )

      scanner.render(
        (decodedText) => {
          handleCode(decodedText)
        },
        () => {
          // Ignore scan frame errors
        }
      )

      scannerRef.current = scanner

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {})
        }
      }
    }
  }, [cameraActive])

  return (
    <div className="scanner-container card">
      <div className="scanner-header flex-between">
        <h3>{title}</h3>
        <button
          type="button"
          className={cameraActive ? 'btn sm outline' : 'btn sm primary'}
          onClick={() => setCameraActive(!cameraActive)}
        >
          {cameraActive ? <Keyboard size={16} /> : <Camera size={16} />}
          {cameraActive ? 'Use Keyboard / Hardware' : 'Use Camera'}
        </button>
      </div>

      {cameraActive ? (
        <div className="camera-box">
          <div id="reader" style={{ width: '100%' }}></div>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="hardware-box">
          <label className="input-group">
            <input
              ref={inputRef}
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={placeholder}
              className="barcode-input"
              autoComplete="off"
            />
            <button type="submit" className="btn primary">
              Add
            </button>
          </label>
          <p className="help-text">
            💡 Point hardware barcode scanner here or type tag and press Enter.
          </p>
        </form>
      )}

      {recentList.length > 0 && (
        <div className="recent-scans">
          <p className="sub-title">Scanned this session ({recentList.length}):</p>
          <ul className="tag-chips">
            {recentList.map((tag, idx) => (
              <li key={idx} className="chip">
                <CheckCircle size={14} className="icon-green" /> {tag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

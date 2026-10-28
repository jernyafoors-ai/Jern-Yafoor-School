// Audio & haptic feedback for scanner

let audioCtx = null

export function playSuccessBeep() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.15)
  } catch {
    // Audio context not allowed or supported
  }

  if (navigator.vibrate) {
    try {
      navigator.vibrate(80)
    } catch {
      // Vibration not supported
    }
  }
}

// Map to keep track of scanned items and timestamps for duplicate filtering
const recentScans = new Map()

export function isDuplicateScan(code, windowMs = 2000) {
  const now = Date.now()
  const lastTime = recentScans.get(code)
  if (lastTime && now - lastTime < windowMs) {
    return true
  }
  recentScans.set(code, now)
  return false
}

/**
 * Image storage & compression utility
 * Currently compresses image to ~800px width JPEG data URL (<100KB)
 * Behind a clean abstraction so photo storage can be swapped to Google Drive / Cloud Storage later.
 */

export async function compressImage(fileOrDataUrl, maxWidth = 800, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl)
    }

    img.onerror = (err) => reject(err)

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(fileOrDataUrl)
    }
  })
}

/**
 * Storage abstraction: accepts a file/dataUrl and returns the stored photo URL/string.
 * Swap implementation here if migrating to Drive or Cloud Storage.
 */
export async function processPhoto(file) {
  if (!file) return null
  return await compressImage(file, 800, 0.6)
}

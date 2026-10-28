export const BUILDINGS = [
  { code: 'OB', name: 'Old Building' },
  { code: 'NB', name: 'New Building' }
]

export const FLOORS = [
  { code: 'GF', name: 'Ground Floor' },
  { code: 'FF', name: 'First Floor' },
  { code: 'SF', name: 'Second Floor' }
]

export const ROOM_TYPES = [
  { code: 'classroom', name: 'Classroom' },
  { code: 'lab', name: 'Science / Computer Lab' },
  { code: 'store', name: 'Store Room' },
  { code: 'music', name: 'Music Room' },
  { code: 'clinic', name: 'Clinic' },
  { code: 'doctor', name: 'Doctor Room' },
  { code: 'hsc', name: 'HSC Room' },
  { code: 'office', name: 'Office' },
  { code: 'other', name: 'Other' }
]

export function formatRoomCode(building, floor, number) {
  const numStr = String(number).padStart(3, '0')
  return `${building}-${floor}-${numStr}`
}

export function parseRoomCode(code) {
  if (!code) return null
  const parts = code.split('-')
  if (parts.length !== 3) return null
  return {
    building: parts[0],
    floor: parts[1],
    number: parts[2]
  }
}

export function suggestNextNumber(existingRoomCodes, building, floor) {
  const prefix = `${building}-${floor}-`
  let maxNum = 0

  existingRoomCodes.forEach((code) => {
    if (code.startsWith(prefix)) {
      const numPart = code.substring(prefix.length)
      const num = parseInt(numPart, 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  })

  return String(maxNum + 1).padStart(3, '0')
}

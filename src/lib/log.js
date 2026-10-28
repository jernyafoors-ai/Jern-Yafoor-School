import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Log activity to Firestore collection 'activity'
 */
export async function logActivity(action, details = {}, userEmail = 'system') {
  try {
    await addDoc(collection(db, 'activity'), {
      action,
      details,
      userEmail,
      createdAt: serverTimestamp(),
      dateStr: new Date().toISOString()
    })
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}

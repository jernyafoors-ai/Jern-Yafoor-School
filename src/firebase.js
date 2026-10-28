import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig'

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)

    // Offline mode: local cache in browser, automatic sync when online
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    })
  } catch (err) {
    console.error('Firebase Initialization Error:', err)
  }
}

export { app, auth, db }

// Firebase Console > Project settings > Your apps > Web app
// Copy your web app config and paste the values below.
export const firebaseConfig = {
  apiKey: 'PASTE_HERE',
  authDomain: 'PASTE_HERE',
  projectId: 'PASTE_HERE',
  storageBucket: 'PASTE_HERE',
  messagingSenderId: 'PASTE_HERE',
  appId: 'PASTE_HERE'
}

// Check if actual credentials have been pasted
export const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'PASTE_HERE' &&
  firebaseConfig.projectId !== 'PASTE_HERE'

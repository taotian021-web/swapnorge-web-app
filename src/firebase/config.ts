export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB5p-Sh7XKgYSFGYIi1ZsqjEBDWYz_Ri4Q',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'neighborbuy1-67584686-a9a83.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'neighborbuy1-67584686-a9a83',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '21486878236',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:21486878236:web:1d158916f0241a6598a9d9',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

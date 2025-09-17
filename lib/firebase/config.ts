import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCVqEY-UiA8NFMPhyUiNosIh4qXV6R1gc0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "isabella-conteudos.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "isabella-conteudos",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "isabella-conteudos.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "9126922855",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:9126922855:web:1b55a76e0929f1b1e0e2c2",
}

console.log("[v0] Firebase config:", firebaseConfig)

let app
let auth
let db
let storage

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  console.log("[v0] Firebase app initialized successfully")

  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app)
  console.log("[v0] Firebase auth initialized successfully")

  db = getFirestore(app)
  storage = getStorage(app)
  console.log("[v0] Firebase Firestore and Storage initialized successfully")
} catch (error) {
  console.error("[v0] Firebase initialization error:", error)
  throw new Error(`Firebase initialization failed: ${error}`)
}

export { auth, db, storage }
export default app

// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ensure we have default values for required Firebase config
const REQUIRED_ENV_VARS = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-key-for-build',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'golf-improvement-app.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'golf-improvement-app',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'golf-improvement-app.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:000000000000'
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: REQUIRED_ENV_VARS.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: REQUIRED_ENV_VARS.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: REQUIRED_ENV_VARS.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: REQUIRED_ENV_VARS.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: REQUIRED_ENV_VARS.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: REQUIRED_ENV_VARS.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let firebaseApp;
let auth;
let db;

try {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  // Initialize services
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  
  // Log success for debugging
  console.log("Firebase successfully initialized");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  
  // Create dummy instances for SSR
  auth = {} as any;
  db = {} as any;
}

export { auth, db }; 
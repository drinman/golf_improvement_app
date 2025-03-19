import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  // Initialize Firebase Admin with credentials from environment variables
  try {
    // For production, use service account from environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      // For development, use service account file
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

// Export admin modules
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin; 
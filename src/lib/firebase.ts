import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Enhanced logging function
const logFirebaseConfig = (config: FirebaseConfig) => {
  console.group('🔥 Firebase Configuration');
  console.log('API Key:', config.apiKey ? '✅ Set' : '❌ Missing');
  console.log('Auth Domain:', config.authDomain ? '✅ Set' : '❌ Missing');
  console.log('Project ID:', config.projectId ? '✅ Set' : '❌ Missing');
  console.log('Storage Bucket:', config.storageBucket ? '✅ Set' : '❌ Missing');
  console.log('Messaging Sender ID:', config.messagingSenderId ? '✅ Set' : '❌ Missing');
  console.log('App ID:', config.appId ? '✅ Set' : '❌ Missing');
  console.groupEnd();
};

// Validate Firebase configuration
const validateFirebaseConfig = (config: FirebaseConfig) => {
  const requiredFields: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase configuration fields:', missingFields);
    console.error('Please check your .env file and ensure all VITE_FIREBASE_* variables are set');
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }
  
  return true;
};

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // Fixed: was VITE_FIRESTORE_PROJECT_ID
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log and validate configuration
console.log('🚀 Initializing Firebase...');
logFirebaseConfig(firebaseConfig);
validateFirebaseConfig(firebaseConfig);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase initialized successfully');
  console.log('📊 Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  throw error;
}

export { auth, db, storage };
export default app;

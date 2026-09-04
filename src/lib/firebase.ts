import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  type Firestore,
  getFirestore,
} from "firebase/firestore";
import {
  connectFunctionsEmulator,
  type Functions,
  getFunctions,
} from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let functions: Functions;

if (firebaseConfigured) {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  if (import.meta.env.VITE_USE_EMULATORS === "true") {
    // Guard against double-connect during HMR.
    const w = window as unknown as { __emulatorsConnected?: boolean };
    if (!w.__emulatorsConnected) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      w.__emulatorsConnected = true;
    }
  }
} else {
  // Firebase isn't configured yet (no .env). Pages that depend on it should
  // check `firebaseConfigured` and render a setup notice instead of crashing.
  app = undefined as unknown as FirebaseApp;
  auth = undefined as unknown as Auth;
  db = undefined as unknown as Firestore;
  functions = undefined as unknown as Functions;
}

export { app, auth, db, functions };

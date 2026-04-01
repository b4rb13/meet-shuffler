import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase as getDb, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    const existing = getApps();
    app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getDatabase(): Database {
  if (!db) {
    db = getDb(getApp());
  }
  return db;
}

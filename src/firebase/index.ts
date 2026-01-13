
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, Firestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore'

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export async function initializeFirebase() {
  if (getApps().length === 0) {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      // Re-throw or handle as appropriate for your app's error strategy
      throw e;
    }
  } else {
    firebaseApp = getApp();
  }

  // Initialize services. We need to do this check every time
  // in case this async function is called multiple times.
  if (!firestore) {
    // Use the new API to initialize Firestore with persistence settings
    try {
        firestore = initializeFirestore(firebaseApp, {
            localCache: persistentLocalCache({})
        });
        await enableIndexedDbPersistence(firestore);
    } catch (err: any) {
        if (err.code == 'failed-precondition') {
            // This can happen if multiple tabs are open.
            // The app will still work, but with degraded offline performance.
            console.warn('Firestore persistence could not be enabled. This can happen with multiple tabs open.');
            // Fallback to in-memory Firestore instance if persistence fails
             firestore = initializeFirestore(firebaseApp, { localCache: memoryLocalCache() });
        } else if (err.code == 'unimplemented') {
            // The browser doesn't support IndexedDB.
            console.warn('Your browser does not support offline persistence.');
            firestore = getFirestore(firebaseApp);
        } else {
            console.error("An unexpected error occurred during Firestore initialization:", err);
            // Fallback for other errors
            firestore = getFirestore(firebaseApp);
        }
    }
  }
  
  if (!auth) {
      auth = getAuth(firebaseApp);
  }

  return { firebaseApp, auth, firestore };
}

// This function is kept for any part of the app that might still use it,
// but the async initializeFirebase should be preferred.
export function getSdks(app: FirebaseApp) {
  if (!firestore) {
      // Note: This won't have persistence enabled if called before initializeFirebase.
      firestore = getFirestore(app);
  }
  if (!auth) {
      auth = getAuth(app);
  }
  return {
    firebaseApp: app,
    auth: auth,
    firestore: firestore
  };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

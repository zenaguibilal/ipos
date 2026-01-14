
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, Firestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore'

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let persistenceEnabled = false;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export async function initializeFirebase() {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Initialize services only once.
  if (!firestore) {
    try {
      // Use initializeFirestore only for the first time with persistence settings.
      firestore = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({})
      });
      await enableIndexedDbPersistence(firestore);
      persistenceEnabled = true;
    } catch (err: any) {
      console.warn(`Firestore Persistence Error: ${err.code}`);
      // If persistence fails, subsequent calls should use getFirestore.
      // We get a new firestore instance here without persistence.
      firestore = getFirestore(firebaseApp);
    }
  } else {
    // If firestore is already initialized, just get the instance.
    // This avoids the "already called with different options" error.
    firestore = getFirestore(firebaseApp);
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

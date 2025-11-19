'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export async function initializeFirebase(): Promise<{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore }> {
  const appName = '[DEFAULT]';
  
  // Check if the default app is already initialized
  const alreadyInitialized = getApps().some(app => app.name === appName);

  let firebaseApp: FirebaseApp;

  if (alreadyInitialized) {
    firebaseApp = getApp(appName);
  } else {
    // Initialize the app for the first time
     try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
    
    // Authenticate immediately after initialization
    const auth = getAuth(firebaseApp);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous sign-in failed during initialization:", error);
      // Handle failure gracefully, perhaps by throwing the error to be caught by the provider
      throw error;
    }
  }

  // Always return the SDKs from the initialized app
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
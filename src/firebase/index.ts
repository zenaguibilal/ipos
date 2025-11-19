'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let initializationPromise: Promise<{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; }> | null = null;


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): Promise<{ firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; }> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise(async (resolve, reject) => {
    try {
      if (!getApps().length) {
          firebaseApp = initializeApp(firebaseConfig);
          auth = getAuth(firebaseApp);
          firestore = getFirestore(firebaseApp);
          // Only sign in if there's no current user. This is crucial for HMR.
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
      } else {
          firebaseApp = getApp();
          auth = getAuth(firebaseApp);
          firestore = getFirestore(firebaseApp);
      }
      resolve({ firebaseApp, auth, firestore });
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      reject(error);
    }
  });

  return initializationPromise;
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
export * from './auth/use-user';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
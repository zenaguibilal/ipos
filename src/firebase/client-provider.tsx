'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import useSWR from 'swr';

interface FirebaseClientProviderProps {
  children: React.Node;
}

// The key for SWR to cache our Firebase services initialization
const SWR_KEY = 'firebase-initialization';

// The fetcher function for SWR. It calls our async initialization function.
const initializeFirebaseServices = async () => {
    return await initializeFirebase();
};

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // useSWR will call the fetcher once, cache the result (the promise),
  // and provide the data, error, and loading state.
  const { data: firebaseServices, error, isLoading } = useSWR(
    SWR_KEY,
    initializeFirebaseServices,
    {
      // These settings ensure SWR behaves like a one-time async provider
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  if (isLoading) {
    // A global loading indicator while Firebase is being initialized.
    // This is crucial because persistence can take a moment to enable.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Préparation de l'application hors ligne...</p>
      </div>
    );
  }

  if (error || !firebaseServices) {
    // Handle the unlikely case where Firebase initialization fails.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Erreur critique : Impossible de charger l'application.</p>
        {error && <p className="text-sm text-red-500">{error.message}</p>}
      </div>
    );
  }

  // Once initialization is complete and successful, provide the services to the app.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

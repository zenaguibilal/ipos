'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Make this an async component to await initialization.
export async function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Await the initialization which now includes the async sign-in.
  const firebaseServices = await initializeFirebase();

  // The provider will only render after the services, including auth sign-in, are ready.
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

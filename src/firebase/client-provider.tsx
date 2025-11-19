'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { Loader } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs once on the client after the component mounts.
    const init = async () => {
      try {
        // Only initialize and set services if they haven't been set already.
        if (!services) {
            const firebaseServices = await initializeFirebase();
            setServices(firebaseServices);
        }
      } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Optionally handle the error state in the UI
      }
    };

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once.

  if (!services) {
    // Render a loading state while Firebase is initializing.
    // This prevents children from rendering and trying to access Firebase too early.
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Once services are available, render the actual provider with the children.
  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

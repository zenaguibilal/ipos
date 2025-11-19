'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, getSdks } from '@/firebase';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs once on the client after the component mounts.
    const init = async () => {
      try {
        const firebaseServices = await initializeFirebase();
        setServices(firebaseServices);
      } catch (error) {
        console.error("Firebase initialization failed:", error);
        // Optionally handle the error state in the UI
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []); // Empty dependency array ensures this runs only once.

  if (isLoading || !services) {
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


'use client';

import { SignupForm } from '@/components/auth/signup-form';
import { Suspense } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export default function SignupPage() {
  return (
    <FirebaseClientProvider>
        <div className="flex min-h-screen items-center justify-center p-4">
        <Suspense fallback={<div className="text-center">Chargement...</div>}>
            <SignupForm />
        </Suspense>
        </div>
    </FirebaseClientProvider>
  );
}

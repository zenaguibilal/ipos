'use client';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Suspense } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <FirebaseClientProvider>
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="hidden bg-muted lg:flex flex-col items-center justify-center p-8 text-center">
                <Link href="/" className="flex items-center gap-4 font-bold text-5xl mb-4">
                    <span className="text-6xl">🏪</span>
                    <span>iPOS</span>
                </Link>
                <p className="text-xl text-muted-foreground">
                    La solution de point de vente moderne pour gérer votre commerce avec simplicité et efficacité.
                </p>
            </div>
             <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <Suspense fallback={<div className="text-center">Chargement...</div>}>
                        <ForgotPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    </FirebaseClientProvider>
  );
}

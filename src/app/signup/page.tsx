'use client';

import { SignupForm } from '@/components/auth/signup-form';
import { Suspense } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <FirebaseClientProvider>
      <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
        <div className="hidden bg-muted lg:flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10">
                <Link href="/" className="flex items-center gap-4 font-bold text-5xl mb-4">
                    <span className="text-6xl">🏪</span>
                    <span>iPOS</span>
                </Link>
                <p className="text-xl text-muted-foreground">
                    La solution de point de vente moderne pour gérer votre commerce avec simplicité et efficacité.
                </p>
            </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="mx-auto grid w-[350px] gap-6">
             <Suspense fallback={<div className="text-center">Chargement...</div>}>
                <SignupForm />
            </Suspense>
          </div>
        </div>
      </div>
    </FirebaseClientProvider>
  );
}


'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LandingPage } from '@/components/landing/landing-page';

function HomePageContent() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Chargement...</p>
            </div>
        )
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LandingPage />
      </main>
    );
}


export default function HomePage() {
    return (
        <FirebaseClientProvider>
            <HomePageContent />
        </FirebaseClientProvider>
    )
}



'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LandingPage } from '@/components/landing/landing-page';

function HomePageContent() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/sell');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || user) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <p>Chargement...</p>
            </div>
        )
    }

    return (
      <main className="min-h-screen bg-background">
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

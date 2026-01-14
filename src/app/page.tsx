
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function HomePageContent() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/dashboard');
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
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
             <div className="flex min-h-screen items-center justify-center p-4">
                <Suspense fallback={<div className="text-center">Chargement...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
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

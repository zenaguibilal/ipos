'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { InstallPWAButton } from '@/components/layout/install-pwa-button';


export default function HomePage() {
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
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    Bienvenue sur iPOS 🏪
                </h1>
                <p className="max-w-md text-muted-foreground">
                    Votre solution de point de vente simple et efficace. Connectez-vous pour commencer.
                </p>
                <InstallPWAButton />
            </div>
        </main>
    );
}

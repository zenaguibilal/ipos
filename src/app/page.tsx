'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page now simply redirects to the main application page.
export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/sell');
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Chargement de l'application...</p>
        </div>
    );
}

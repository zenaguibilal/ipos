'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SellPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <p>Redirection...</p>
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview LOGIN PAGE (OBLITERATED)
 * هذه الصفحة ميتة برمجياً. يتم التحويل فوراً.
 */
export default function LoginPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    return null;
}

'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION)
 * يمنع أي تسرب للبيانات إلى التخزين الدائم ويفرض حتمية الذاكرة.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 1. تدمير فوري لكافة الـ Service Workers لقتل أي ميكانيكية Offline
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        // 2. التطهير المستمر (Continuous Storage Purge)
        const executePurge = () => {
            if (typeof localStorage !== 'undefined') localStorage.clear();
            if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
            if (typeof indexedDB !== 'undefined') {
                indexedDB.databases().then(dbs => {
                    dbs.forEach(db => { if(db.name) indexedDB.deleteDatabase(db.name); });
                });
            }
        };

        executePurge();
        const purgeInterval = setInterval(executePurge, 10000);

        return () => clearInterval(purgeInterval);
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
        >
            {children}
            <Toaster richColors position="top-right" />
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

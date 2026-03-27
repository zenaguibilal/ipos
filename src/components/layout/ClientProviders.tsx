
'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION)
 * Enforces total memory-only state and absolute data purge.
 * Eradicates: Service Workers, IndexedDB, LocalStorage, SessionStorage, Cache API, and Cookies.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Immediate termination of any potential PWA mechanisms
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        // 2. Comprehensive Continuous Purification Protocol (MERCILESS)
        const executeTotalPurge = () => {
            try {
                // Storage Wipe
                localStorage.clear();
                sessionStorage.clear();
                
                // Database Wipe (IndexedDB)
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { if(db.name) window.indexedDB.deleteDatabase(db.name); });
                    });
                }

                // Cache API Wipe (Total Network Memory Erasure)
                if ('caches' in window) {
                    caches.keys().then((names) => {
                        for (const name of names) caches.delete(name);
                    });
                }

                // Cookie Wipe (Eradicate Session Persistence)
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            } catch (e) {
                // Fail silently but ensure execution continues
            }
        };

        // Execute immediately and monitor every 2 seconds
        executeTotalPurge();
        const purgeInterval = setInterval(executeTotalPurge, 2000);

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

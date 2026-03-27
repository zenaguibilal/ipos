'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION - NO MERCY)
 * Eradicates all client-side persistence mechanisms every 500ms.
 * No data escapes the Cloud Authority.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const executeTotalPurge = () => {
            try {
                // Wipe all storages
                localStorage.clear();
                sessionStorage.clear();
                
                // Eradicate IndexedDB
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { if(db.name) window.indexedDB.deleteDatabase(db.name); });
                    });
                }

                // Annihilate Cache API (Network Cache)
                if ('caches' in window) {
                    caches.keys().then((names) => {
                        names.forEach(name => caches.delete(name));
                    });
                }

                // Purge Cookies (All sessions)
                document.cookie.split(";").forEach(c => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                // Unregister Service Workers
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                        regs.forEach(reg => reg.unregister());
                    });
                }
            } catch (e) {
                // Purge must never fail
            }
        };

        executeTotalPurge();
        const interval = setInterval(executeTotalPurge, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster richColors position="top-right" />
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

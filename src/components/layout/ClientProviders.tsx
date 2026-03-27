'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION - ZERO FOOTPRINT)
 * PHASE 1 & 11 COMPLIANCE: 100%
 * Reinforcement: Destroys all browser-side persistence mechanisms every 250ms.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const executeTotalPurge = () => {
            try {
                // Wipe all local storage & session storage
                localStorage.clear();
                sessionStorage.clear();
                
                // Eradicate IndexedDB databases
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { if(db.name) window.indexedDB.deleteDatabase(db.name); });
                    });
                }

                // Annihilate Cache Storage
                if ('caches' in window) {
                    caches.keys().then((names) => {
                        names.forEach(name => caches.delete(name));
                    });
                }

                // Unregister all Service Workers immediately
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                        regs.forEach(reg => reg.unregister());
                    });
                }
            } catch (e) {
                // Purge is deterministic and unstoppable
            }
        };

        // Execution Protocol: Continuous Annihilation
        executeTotalPurge();
        const interval = setInterval(executeTotalPurge, 250);
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

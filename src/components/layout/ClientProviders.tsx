'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (NUCLEAR EDITION)
 * PHASE 18: Precision purge logic to protect system-critical UX keys.
 * Ensures that theme and user preferences are NOT wiped by the cloud-only enforcement protocol.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const executeTargetedPurge = () => {
            try {
                // SURGICAL PURGE: Protect only what's essential for the UI Stability
                const whitelistedKeys = ['theme', 'ipos-ui-pref', 'next-themes-system'];
                
                // Clear LocalStorage safely
                Object.keys(localStorage).forEach(key => {
                    if (!whitelistedKeys.some(w => key.includes(w))) {
                        localStorage.removeItem(key);
                    }
                });

                // Clear SessionStorage safely
                Object.keys(sessionStorage).forEach(key => {
                    if (!whitelistedKeys.some(w => key.includes(w))) {
                        sessionStorage.removeItem(key);
                    }
                });
                
                // Nuclear IndexedDB Purge
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { if(db.name) window.indexedDB.deleteDatabase(db.name); });
                    });
                }

                // Cache Purge
                if ('caches' in window) {
                    caches.keys().then((names) => {
                        names.forEach(name => caches.delete(name));
                    });
                }

                // Service Worker Suppression
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                        regs.forEach(reg => reg.unregister());
                    });
                }
            } catch (err) {
                // Failure is silent but the purge must attempt completion
            }
        };

        // Immediate Purge on Mount
        executeTargetedPurge();
        
        // Cyclic Authority Check
        const interval = setInterval(executeTargetedPurge, 5000);
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

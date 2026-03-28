
'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION - ZERO FOOTPRINT)
 * PHASE 17: Nuclear reconstruction of the purge logic to spare system-critical keys.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const executeTargetedPurge = () => {
            try {
                // Nuclear Purge with Surgical Precision: 
                // We keep 'theme' for next-themes and 'ipos-ui-pref' for UX stability
                const criticalKeys = ['theme', 'ipos-ui-pref'];
                
                Object.keys(localStorage).forEach(key => {
                    if (!criticalKeys.includes(key)) {
                        localStorage.removeItem(key);
                    }
                });

                Object.keys(sessionStorage).forEach(key => {
                    if (!criticalKeys.includes(key)) {
                        sessionStorage.removeItem(key);
                    }
                });
                
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { if(db.name) window.indexedDB.deleteDatabase(db.name); });
                    });
                }

                if ('caches' in window) {
                    caches.keys().then((names) => {
                        names.forEach(name => caches.delete(name));
                    });
                }

                // Service Worker suppression remains absolute
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(regs => {
                        regs.forEach(reg => reg.unregister());
                    });
                }
            } catch {
                // Purge failure is ignored but monitored
            }
        };

        executeTargetedPurge();
        // Reduced frequency to lower CPU overhead while maintaining authority
        const interval = setInterval(executeTargetedPurge, 2000);
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

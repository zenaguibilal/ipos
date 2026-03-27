'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE PROVIDER ROOT
 * Purged of all legacy persistence and service worker registration.
 * Force-cleans any residual service worker cache on mount.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Absolute destruction of any residual service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        // Clean any residual storage that might cause hydration mismatches
        const purgeKeys = ['dexie', 'offline', 'persist:'];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && purgeKeys.some(p => key.includes(p))) {
                localStorage.removeItem(key);
            }
        }
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
        >
            {children}
            <Toaster richColors />
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

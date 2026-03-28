'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (AUTONOMOUS ENFORCEMENT)
 * NUCLEAR MODE: Enforces Cloud-Only architecture while protecting system-critical session keys.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        /**
         * Surgically purges non-essential local storage to maintain Cloud Sovereignty.
         */
        const executeSurgicalPurge = () => {
            try {
                // WHITELIST: Protect only essential stability keys
                const whitelistedKeys = [
                    'theme', 
                    'ipos-ui-pref', 
                    'next-themes-system', 
                    'zustand-app-store',
                    'sb-' // Supabase critical auth keys (Wildcard)
                ];
                
                const purgeStorage = (storage: Storage) => {
                    const keys = Object.keys(storage);
                    keys.forEach(key => {
                        const isWhitelisted = whitelistedKeys.some(w => key === w || key.startsWith(w));
                        if (!isWhitelisted) {
                            storage.removeItem(key);
                        }
                    });
                };

                purgeStorage(localStorage);
                purgeStorage(sessionStorage);
                
                // Nuclear IndexedDB Purge (Ensures no offline data persistence)
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { 
                            if(db.name && !whitelistedKeys.some(w => db.name!.includes(w))) {
                                window.indexedDB.deleteDatabase(db.name); 
                            }
                        });
                    });
                }
            } catch (err) {
                // Defensive silence for non-critical failures
            }
        };

        // Execute purge immediately and then on an interval
        executeSurgicalPurge();
        const interval = setInterval(executeSurgicalPurge, 300000); // 5 minutes
        
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

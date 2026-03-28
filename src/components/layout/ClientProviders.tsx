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

        const executeSurgicalPurge = () => {
            try {
                // WHITELIST: Protect only essential stability keys
                const whitelistedKeys = [
                    'theme', 
                    'ipos-ui-pref', 
                    'next-themes-system', 
                    'zustand-app-store',
                    'sb-' // Supabase critical auth keys
                ];
                
                const purgeStorage = (storage: Storage) => {
                    Object.keys(storage).forEach(key => {
                        const isWhitelisted = whitelistedKeys.some(w => key === w || key.startsWith(w));
                        if (!isWhitelisted) {
                            storage.removeItem(key);
                        }
                    });
                };

                purgeStorage(localStorage);
                purgeStorage(sessionStorage);
                
                // Nuclear IndexedDB Purge
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
                // Defensive silence
            }
        };

        executeSurgicalPurge();
        const interval = setInterval(executeSurgicalPurge, 600000); // Surgical cleaning every 10 mins
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

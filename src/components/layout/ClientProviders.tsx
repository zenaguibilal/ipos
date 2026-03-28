'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (NUCLEAR RECONSTRUCTION)
 * NUCLEAR MODE: Enforces Cloud-Only architecture while protecting system-critical session keys.
 * Ensures data cleanliness without sabotaging user experience.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const executeSurgicalPurge = () => {
            try {
                // WHITELIST: Protect only essential stability keys to prevent session loss or UI sabotage
                const whitelistedKeys = [
                    'theme', 
                    'ipos-ui-pref', 
                    'next-themes-system', 
                    'supabase.auth.token',
                    'zustand-app-store',
                    'sb-' // Supabase internal auth keys
                ];
                
                const purgeStorage = (storage: Storage) => {
                    Object.keys(storage).forEach(key => {
                        if (!whitelistedKeys.some(w => key === w || key.startsWith(w))) {
                            storage.removeItem(key);
                        }
                    });
                };

                // Surgical cleaning of transient local data
                purgeStorage(localStorage);
                purgeStorage(sessionStorage);
                
                // Nuclear IndexedDB Purge (Ensures no local database persistence leaks)
                if (window.indexedDB && window.indexedDB.databases) {
                    window.indexedDB.databases().then(dbs => {
                        dbs.forEach(db => { 
                            if(db.name && !whitelistedKeys.some(w => db.name!.includes(w))) {
                                window.indexedDB.deleteDatabase(db.name); 
                            }
                        });
                    });
                }

                // Cloud-Only Cache Enforcement
                if ('caches' in window) {
                    caches.keys().then((names) => {
                        names.forEach(name => {
                            if (!whitelistedKeys.some(w => name.includes(w))) {
                                caches.delete(name);
                            }
                        });
                    });
                }
            } catch (err) {
                // Defensive silence to prevent UI crash in restricted environments
            }
        };

        // Immediate Execution on Handshake
        executeSurgicalPurge();
        
        // Authority Reinforcement Cycle (Balanced interval for cloud authority)
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

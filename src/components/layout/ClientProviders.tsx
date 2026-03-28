'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (SURGICAL RECONSTRUCTION)
 * NUCLEAR MODE: Enforces Cloud-Only architecture while protecting system-critical UX keys.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const executeSurgicalPurge = () => {
            try {
                // WHITELIST: Protect only essential stability keys to prevent UI flickering
                const whitelistedKeys = [
                    'theme', 
                    'ipos-ui-pref', 
                    'next-themes-system', 
                    'supabase.auth.token',
                    'zustand-app-store' // If persistence is ever added to Zustand
                ];
                
                const purgeStorage = (storage: Storage) => {
                    Object.keys(storage).forEach(key => {
                        if (!whitelistedKeys.some(w => key === w || key.startsWith(w))) {
                            storage.removeItem(key);
                        }
                    });
                };

                // Surgical cleaning
                purgeStorage(localStorage);
                purgeStorage(sessionStorage);
                
                // Nuclear IDB Purge
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
            } catch (err) {
                // Fail silently to prevent UI crash
            }
        };

        // Immediate Execution
        executeSurgicalPurge();
        
        // Authority Reinforcement Cycle (Every 30 seconds instead of 10 to balance performance)
        const interval = setInterval(executeSurgicalPurge, 30000); 
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

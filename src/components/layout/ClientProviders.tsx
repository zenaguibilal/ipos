'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION)
 * يمنع أي تسرب للبيانات إلى التخزين الدائم ويفرض حتمية الذاكرة.
 * تم تحديثه ليشمل إبادة Cache API.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 1. تدمير فوري لكافة الـ Service Workers لقتل أي ميكانيكية Offline
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                }
            });
        }
        
        // 2. التطهير المستمر والشامل (Continuous Storage & Cache Purge)
        const executePurge = () => {
            // مسح التخزين المحلي والجلسات
            if (typeof localStorage !== 'undefined') localStorage.clear();
            if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
            
            // مسح قواعد البيانات المحلية (IndexedDB)
            if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
                indexedDB.databases().then(dbs => {
                    dbs.forEach(db => { if(db.name) indexedDB.deleteDatabase(db.name); });
                });
            }

            // إبادة Cache API (منع تخزين استجابات الشبكة)
            if (typeof caches !== 'undefined') {
                caches.keys().then((names) => {
                    for (const name of names) caches.delete(name);
                });
            }
        };

        executePurge();
        // تقليل الفاصل الزمني لفرض الرقابة الصارمة
        const purgeInterval = setInterval(executePurge, 5000);

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

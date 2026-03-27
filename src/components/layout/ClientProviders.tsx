
'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER
 * PHASE 5: STATE SINGULARITY ENFORCEMENT.
 * يضمن تطهير الذاكرة المحلية تماماً لفرض سيادة الذاكرة العشوائية (RAM) والسحاب فقط.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 1. تدمير فوري لكافة الـ Service Workers المسجلين
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                    console.warn('PURIFICATION: Service Worker Destroyed');
                }
            });
        }
        
        // 2. تطهير شامل للتخزين المحلي (Persistent Storage Purge)
        // نقتل أي محاولة للتخزين الدائم خارج نطاق الجلسة الحية.
        const criticalPurgeKeys = [
            'dexie', 'offline', 'persist:', 'workbox', 
            'supabase.auth.token', 'zustand', 'ipos-state'
        ];
        
        if (typeof localStorage !== 'undefined') {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && criticalPurgeKeys.some(p => key.includes(p))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => {
                localStorage.removeItem(k);
                console.warn(`PURIFICATION: Persistent Key [${k}] Erased`);
            });
        }

        // 3. مسح الـ Caches بالكامل
        if (typeof caches !== 'undefined') {
            caches.keys().then((names) => {
                for (const name of names) {
                    caches.delete(name);
                    console.warn(`PURIFICATION: Cache [${name}] Flushed`);
                }
            });
        }

        // 4. تعطيل الـ Context Menu لمنع التلاعب بالبيانات الحية (اختياري لتعزيز الهيمنة)
        const handleContext = (e: MouseEvent) => {
            if (process.env.NODE_ENV === 'production') e.preventDefault();
        };
        document.addEventListener('contextmenu', handleContext);
        return () => document.removeEventListener('contextmenu', handleContext);
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
            {/* حاوية الطباعة المركزية */}
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

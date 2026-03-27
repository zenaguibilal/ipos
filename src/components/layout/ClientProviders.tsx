'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER
 * يقوم بتطهير بيئة العميل من أي Service Workers أو مخلفات التخزين المحلي.
 * يضمن بقاء النظام Cloud-Only بنسبة 100%.
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
        
        // 2. تطهير التخزين المحلي من أي مفاتيح متعلقة بالمزامنة أو قواعد البيانات المحلية
        // لا نسمح ببقاء أي بيانات خارج نطاق الجلسة (Session) الحالية
        const criticalPurgeKeys = ['dexie', 'offline', 'persist:', 'workbox', 'supabase.auth.token'];
        if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && criticalPurgeKeys.some(p => key.includes(p))) {
                    localStorage.removeItem(key);
                    console.warn(`PURIFICATION: Local Key [${key}] Erased`);
                }
            }
        }

        // 3. مسح الـ Caches بالكامل لمنع تحميل ملفات قديمة
        if (typeof caches !== 'undefined') {
            caches.keys().then((names) => {
                for (const name of names) {
                    caches.delete(name);
                    console.warn(`PURIFICATION: Cache [${name}] Flushed`);
                }
            });
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
            {/* حاوية الطباعة المركزية */}
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

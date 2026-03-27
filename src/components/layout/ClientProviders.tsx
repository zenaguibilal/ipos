
'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';

/**
 * @fileOverview THE SYSTEM PURIFIER (ABSOLUTE EDITION)
 * PHASE 5: STATE SINGULARITY ENFORCEMENT.
 * يفرض سيادة الذاكرة العشوائية (RAM) والسحاب ويمنع أي تسرب للبيانات إلى القرص الصلب.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 1. تدمير فوري لكافة الـ Service Workers لقتل أي ميكانيكية Offline
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                    registration.unregister();
                    console.warn('PURIFICATION: Service Worker Obliterated');
                }
            });
        }
        
        // 2. التطهير المستمر (Continuous Storage Purge)
        // نقتل أي محاولة للتخزين الدائم خارج نطاق الجلسة الحية.
        const criticalPurgeKeys = [
            'dexie', 'offline', 'persist:', 'workbox', 
            'supabase.auth.token', 'zustand', 'ipos-state', 'sb-'
        ];
        
        const executePurge = () => {
            if (typeof localStorage !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && criticalPurgeKeys.some(p => key.includes(p))) {
                        localStorage.removeItem(key);
                    }
                }
            }
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear();
            }
        };

        // تنفيذ التطهير عند الإقلاع وبشكل دوري لمنع المكتبات من التسلل للقرص
        executePurge();
        const purgeInterval = setInterval(executePurge, 5000);

        // 3. مسح الـ Caches بالكامل
        if (typeof caches !== 'undefined') {
            caches.keys().then((names) => {
                for (const name of names) {
                    caches.delete(name);
                }
            });
        }

        // 4. حماية واجهة النظام في الإنتاج
        const handleContext = (e: MouseEvent) => {
            if (process.env.NODE_ENV === 'production') e.preventDefault();
        };
        document.addEventListener('contextmenu', handleContext);

        console.warn('PURIFICATION: State Singularity Active. Memory-only mode enforced.');

        return () => {
            clearInterval(purgeInterval);
            document.removeEventListener('contextmenu', handleContext);
        };
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
            {/* حاوية الطباعة المركزية */}
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

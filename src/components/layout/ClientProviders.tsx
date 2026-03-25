
'use client';

import { useEffect } from 'react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js').then(
                    (registration) => {
                        console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    (err) => {
                        console.log('Service Worker registration failed: ', err);
                    }
                );
            });
        }
    }, []);

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
            <Toaster richColors />
            <div id="receipt-for-print" className="hidden"></div>
        </ThemeProvider>
    );
}

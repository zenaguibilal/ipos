'use client';

import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';

/**
 * @fileOverview THE PROVIDER ROOT
 * Purged of all legacy persistence and service worker registration.
 */

export function ClientProviders({ children }: { children: React.ReactNode }) {
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

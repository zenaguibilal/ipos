'use client';

import { useEffect } from 'react';

interface HotkeyOptions {
    onFinalize?: () => void;
    onNew?: () => void;
    onCustomProduct?: () => void;
}

export function useSellHotkeys(options: HotkeyOptions) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;

            // Ignore hotkeys if user is typing in an input field
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                // Allow 'Enter' in search input for barcode scanning
                if (target.id === 'product-search-input' && event.key === 'Enter') {
                    // let the component handle it
                } else {
                    return;
                }
            }
            
            // Finalize Sale (F4)
            if (event.key === 'F4') {
                event.preventDefault();
                options.onFinalize?.();
            }

            // New Item (Alt + N)
            if (event.altKey && event.key.toLowerCase() === 'n') {
                event.preventDefault();
                options.onNew?.();
            }
            
            // Custom Product (Alt + A)
            if (event.altKey && event.key.toLowerCase() === 'a') {
                event.preventDefault();
                options.onCustomProduct?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [options]);
}

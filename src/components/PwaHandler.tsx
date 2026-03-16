'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const PwaHandler = () => {
    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            process.env.NODE_ENV === 'production'
        ) {
            const wb = navigator.serviceWorker;

            wb.register('/sw.js').then(registration => {
                console.log('SW registered:', registration.scope);
                
                // Logic to handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content is available, show a toast
                                toast.info("Une nouvelle version est disponible !", {
                                    action: {
                                        label: "Recharger",
                                        onClick: () => {
                                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        }
                                    },
                                    duration: Infinity,
                                });
                            }
                        });
                    }
                });
            }).catch(err => {
                console.error('SW registration failed:', err);
            });

            let refreshing = false;
            wb.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });
        }
    }, []);
    return null;
};

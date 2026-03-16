'use client';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const PwaHandler = () => {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
            const wb = window.workbox;
            
            const showUpdateToast = () => {
                 toast.info("Une nouvelle version est disponible !", {
                    action: {
                        label: "Recharger",
                        onClick: () => wb.messageSW({ type: 'SKIP_WAITING' })
                    },
                    duration: Infinity,
                 });
            };

            // A common listener for all service worker states
            wb.addEventListener('waiting', showUpdateToast);
            wb.addEventListener('externalwaiting', showUpdateToast);
            
            // Reload the page when the new service worker has taken control
            wb.addEventListener('controlling', () => {
                window.location.reload();
            });

            // Register the service worker
            wb.register();
        }
    }, []);
    return null;
};

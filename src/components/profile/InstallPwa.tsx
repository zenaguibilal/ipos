'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { DownloadCloud, CheckCircle } from 'lucide-react';

export function InstallPwa() {
    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if the app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setCanInstall(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;
        (installPrompt as any).prompt();
        const { outcome } = await (installPrompt as any).userChoice;
        if (outcome === 'accepted') {
            setCanInstall(false);
            setInstallPrompt(null);
        }
    };

    return (
        <>
            <CardContent>
                {canInstall ? (
                    <p className="text-sm text-muted-foreground">
                        L'application est prête à être installée sur votre appareil.
                        Cliquez sur le bouton ci-dessous pour commencer.
                    </p>
                ) : (
                    <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                        <p className="font-semibold">L'application est déjà installée ou le navigateur n'est pas compatible.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {canInstall && (
                    <Button onClick={handleInstall}>
                        <DownloadCloud className="mr-2 h-4 w-4" />
                        Installer l'application
                    </Button>
                )}
            </CardFooter>
        </>
    );
}

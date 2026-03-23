'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';

export function InstallPwa() {
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    };

    // Check if the app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    await installPrompt.prompt();
    // The user choice is handled by the 'appinstalled' event listener
  };
  
  if (isAppInstalled) {
      return (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-6 w-6" />
              <div>
                <h4 className="font-semibold">Application installée</h4>
                <p className="text-sm text-green-500/80">iPOS est déjà installé sur cet appareil. Vous pouvez le lancer depuis votre bureau ou votre menu d'applications.</p>
              </div>
          </div>
      )
  }

  if (!installPrompt) {
    return (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-semibold">Installation non disponible</h4>
              <p className="text-sm text-muted-foreground">Votre navigateur ne prend pas en charge l'installation, ou l'application est déjà installée. Vous pouvez généralement installer l'application via le bouton dans la barre d'adresse de votre navigateur.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-3">
        <h4 className="font-semibold">Installer sur cet appareil</h4>
        <p className="text-sm text-muted-foreground">
            Installez iPOS sur votre ordinateur pour un accès rapide et une expérience hors ligne améliorée.
        </p>
        <Button onClick={handleInstallClick} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Installer l'application
        </Button>
    </div>
  );
}

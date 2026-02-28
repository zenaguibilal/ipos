
'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-sm">
        <WifiOff className="h-16 w-16 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
          <p className="text-muted-foreground">
            Veuillez vérifier votre connexion internet.
            <br />
            Certaines pages pré-chargées peuvent encore être accessibles.
          </p>
        </div>
      </div>
    </div>
  );
}

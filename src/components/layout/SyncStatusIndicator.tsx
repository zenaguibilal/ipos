'use client';

import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

type SyncStatus = 'syncing' | 'online' | 'offline';

export function SyncStatusIndicator() {
  const [status, setStatus] = useState<SyncStatus>(() => navigator.onLine ? 'online' : 'offline');

  useEffect(() => {
    const handleSyncStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<SyncStatus>;
      setStatus(customEvent.detail);
    };

    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');
    
    window.addEventListener('syncStatusChange', handleSyncStatusChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('syncStatusChange', handleSyncStatusChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusConfig = {
    online: {
      icon: <Cloud className="h-5 w-5 text-green-500" />,
      label: 'En ligne et synchronisé',
    },
    syncing: {
      icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
      label: 'Synchronisation en cours...',
    },
    offline: {
      icon: <CloudOff className="h-5 w-5 text-destructive" />,
      label: 'Mode hors ligne',
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center h-10 w-10">
            {currentStatus.icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentStatus.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

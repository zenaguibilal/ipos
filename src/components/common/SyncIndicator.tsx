'use client';

import { useSync } from '@/hooks/useSync';
import { cn } from '@/lib/utils';

export const SyncIndicator = () => {
  const { syncStatus, syncNow } = useSync();

  let statusText = '';
  let statusClass = '';

  if (syncStatus.isSyncing) {
    statusText = 'Synchronisation...';
  } else if (syncStatus.pendingItems > 0) {
    statusText = `${syncStatus.pendingItems} en attente`;
  } else if (syncStatus.lastSync) {
    statusText = `Sync: ${new Date(syncStatus.lastSync).toLocaleTimeString('fr-FR')}`;
  }

  if (syncStatus.error) {
    statusClass = 'text-destructive';
    statusText = 'Erreur Sync';
  }


  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn('h-2.5 w-2.5 rounded-full border', syncStatus.isOnline ? 'bg-success border-green-400' : 'bg-destructive border-red-400')}
        title={syncStatus.isOnline ? 'En ligne' : 'Hors ligne'}
      />
      
      {statusText && <span title={syncStatus.error ?? statusText}>{statusText}</span>}

      <button
        onClick={syncNow}
        disabled={syncStatus.isSyncing || !syncStatus.isOnline}
        title="Synchroniser avec Google Sheets"
        className="text-muted-foreground hover:text-foreground transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className={cn('h-4 w-4', syncStatus.isSyncing && 'animate-spin')} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      </button>
    </div>
  );
};

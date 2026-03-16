'use client';

import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, Check, AlertTriangle, Loader2 } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SyncIndicator = () => {
  const { syncStatus, syncNow } = useSync();

  const getStatusInfo = () => {
    if (syncStatus.isSyncing) {
        return { text: 'Sync...', icon: <Loader2 className="h-4 w-4 animate-spin text-primary" />, color: 'text-primary' };
    }
    if (syncStatus.error) {
        return { text: 'Erreur', icon: <AlertTriangle className="h-4 w-4 text-destructive" />, color: 'text-destructive', tooltip: syncStatus.error };
    }
    if (syncStatus.pendingItems > 0) {
        return { text: `${syncStatus.pendingItems} en attente`, icon: <RefreshCw className="h-4 w-4 text-chart-secondary" />, color: 'text-chart-secondary' };
    }
    if (syncStatus.lastSync) {
        const timeAgo = format(new Date(syncStatus.lastSync), 'HH:mm', { locale: fr });
        return { text: `Sync: ${timeAgo}`, icon: <Check className="h-4 w-4 text-success" />, color: 'text-success' };
    }
    return { text: syncStatus.isOnline ? 'En ligne' : 'Hors ligne', icon: syncStatus.isOnline ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />, color: syncStatus.isOnline ? 'text-success' : 'text-muted-foreground' };
  }

  const { text, icon, color, tooltip } = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                     <div className={cn("flex items-center gap-1.5 text-xs font-medium", color)}>
                        {icon}
                        <span className="hidden sm:inline">{text}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    {tooltip || text}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => syncNow()}
        disabled={syncStatus.isSyncing || !syncStatus.isOnline}
        className="h-8 w-8 rounded-full"
      >
        <RefreshCw className={cn("h-4 w-4 text-muted-foreground", syncStatus.isSyncing && "animate-spin")} />
      </Button>
    </div>
  );
};

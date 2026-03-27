
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, CreditCard, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function CustomerStats({ onRefresh }: { onRefresh?: () => void }) {
  const [stats, setStats] = useState<any>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
        const data = await api.get<any>('customers/stats/summary');
        setStats(data);
    } catch (error) {
        toast.error("Échec des statistiques.");
    } finally {
        if (manual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (stats === undefined) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-xs uppercase font-bold text-muted-foreground">Total Clients</CardTitle><Users className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-black">{stats.total}</div></CardContent></Card>
      <Card className="border-l-4 border-l-chart-secondary"><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-xs uppercase font-bold text-muted-foreground">En Retard</CardTitle><AlertTriangle className="h-4 w-4 text-chart-secondary" /></CardHeader><CardContent><div className="text-2xl font-black text-chart-secondary">{stats.overdue}</div></CardContent></Card>
      <Card className="border-l-4 border-l-destructive"><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-xs uppercase font-bold text-muted-foreground">Plafond Dépassé</CardTitle><UserX className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-black text-destructive">{stats.overLimit}</div></CardContent></Card>
      <Card className="border-l-4 border-l-primary bg-primary/5"><CardHeader className="pb-2 flex-row items-center justify-between space-y-0"><CardTitle className="text-xs uppercase font-bold text-primary">Dette Totale</CardTitle><div className="flex gap-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchStats(true)}><RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} /></Button><CreditCard className="h-4 w-4 text-primary" /></div></CardHeader><CardContent><div className="text-2xl font-black text-primary">{formatCurrency(stats.totalDebt)}</div></CardContent></Card>
    </div>
  );
}

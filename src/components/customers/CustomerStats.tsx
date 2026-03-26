'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, CreditCard, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface CustomerStatsProps {
    onRefresh?: () => void;
}

export function CustomerStats({ onRefresh }: CustomerStatsProps) {
  const [stats, setStats] = useState<{ total: number; overdue: number; overLimit: number; totalDebt: number } | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
        const data = await customerService.getStats();
        setStats(data);
    } catch (error) {
        toast.error("Impossible de charger les statistiques des clients.");
    } finally {
        if (manual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); 
    return () => clearInterval(interval);
  }, [fetchStats]);

  const isLoading = stats === undefined;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{stats.total}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Enregistrés dans iPOS</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-l-4 border-l-chart-secondary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">En Retard</CardTitle>
          <AlertTriangle className="h-4 w-4 text-chart-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-chart-secondary">{stats.overdue}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Échéances dépassées</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-l-4 border-l-destructive">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plafond Dépassé</CardTitle>
          <UserX className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-destructive">{stats.overLimit}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Crédit max. atteint</p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md border-l-4 border-l-primary bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Dette Totale</CardTitle>
          <div className="flex gap-2 items-center">
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchStats(true)} disabled={isRefreshing}>
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
             </Button>
             <CreditCard className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-primary">{formatCurrency(stats.totalDebt)}</div>
          <p className="text-[10px] text-primary/70 mt-1">Capital à recouvrer</p>
        </CardContent>
      </Card>
    </div>
  );
}

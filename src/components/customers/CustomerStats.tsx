'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, CreditCard } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface CustomerStatsProps {
    onRefresh: () => void;
}

export function CustomerStats({ onRefresh }: CustomerStatsProps) {
  const [stats, setStats] = useState<{ total: number; overdue: number; overLimit: number; totalDebt: number } | undefined>(undefined);

  const fetchStats = useCallback(async () => {
    try {
        const data = await customerService.getStats();
        setStats(data);
    } catch (error) {
        toast.error("Impossible de charger les statistiques des clients.");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // This is a simple way to keep stats somewhat in sync. A more robust solution might involve a pub/sub system.
    const interval = setInterval(fetchStats, 30000); // Refresh stats every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats, onRefresh]);

  const isLoading = stats === undefined;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">En Retard</CardTitle>
          <AlertTriangle className="h-4 w-4 text-chart-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-secondary">{stats.overdue}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Plafond Dépassé</CardTitle>
          <UserX className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.overLimit}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Dette Totale</CardTitle>
          <CreditCard className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalDebt)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

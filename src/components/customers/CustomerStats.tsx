'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Customer } from '@/lib/types';
import { Users, AlertTriangle, UserX } from 'lucide-react';
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';

export function CustomerStats() {

  const customers = useLiveQuery(() => dataService.getCustomers({}));
  const isLoading = customers === undefined;

  const stats = useMemo(() => {
    if (!customers) {
      return { total: 0, overdue: 0, overLimit: 0 };
    }
    return {
      total: customers.length,
      overdue: customers.filter(c => c.debtStatus === 'overdue').length,
      overLimit: customers.filter(c => c.isOverLimit).length,
    };
  }, [customers]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Retard de Paiement</CardTitle>
          <AlertTriangle className="h-4 w-4 text-chart-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-secondary">{stats.overdue}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Plafond Dépassé</CardTitle>
          <UserX className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.overLimit}</div>
        </CardContent>
      </Card>
    </div>
  );
}

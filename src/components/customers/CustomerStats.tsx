
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, UserX, CreditCard, RefreshCw, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function CustomerStats() {
  const [stats, setStats] = useState<any>(undefined);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
        const data = await api.get<any>('customers/stats/summary');
        setStats(data);
    } catch (error) {
        toast.error("Échec de l'analyse des statistiques.");
    } finally {
        if (manual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (stats === undefined) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[2rem]" />)}
        </div>
      );
  }

  const StatCard = ({ title, value, icon: Icon, colorClass, desc, subValue, restricted = false }: any) => (
    <Card className={cn(
        "luxury-glass border-white/5 bg-muted/10 transition-all duration-500 hover:border-primary/20 group relative overflow-hidden",
        restricted && "border-destructive/20 bg-destructive/5"
    )}>
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Icon className="h-24 w-24 rotate-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4", colorClass)} />
        </CardHeader>
        <CardContent className="relative z-10 pt-2">
            <div className={cn("text-3xl font-black tracking-tighter", colorClass)}>{value}</div>
            <div className="flex items-center justify-between mt-3">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 italic">{desc}</p>
                {subValue && <span className="text-[10px] font-black px-2 py-0.5 bg-white/5 rounded-lg border border-white/5">{subValue}</span>}
            </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Base Clientèle" 
        value={stats.total} 
        icon={Users} 
        colorClass="text-primary" 
        desc="Membres enregistrés" 
      />
      <StatCard 
        title="État des Retards" 
        value={stats.overdue} 
        icon={AlertTriangle} 
        colorClass="text-orange-500" 
        desc="Comptes en attente"
        subValue="Attention"
      />
      <StatCard 
        title="Plafond Dépassé" 
        value={stats.overLimit} 
        icon={UserX} 
        colorClass="text-destructive" 
        desc="Autorité à vérifier"
        restricted={stats.overLimit > 0}
      />
      <StatCard 
        title="Encours Global" 
        value={formatCurrency(stats.totalDebt)} 
        icon={CreditCard} 
        colorClass="text-primary" 
        desc="Volume des créances"
        subValue={<Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-primary/10" onClick={() => fetchStats(true)}><RefreshCw className={cn("h-3 w-3 text-primary", isRefreshing && "animate-spin")} /></Button>}
      />
    </div>
  );
}

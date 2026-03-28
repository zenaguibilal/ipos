
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Wallet, TrendingUp, Target, Activity } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

interface CustomerMetricsProps {
    customer: Customer;
}

export function CustomerMetrics({ customer }: CustomerMetricsProps) {
    const creditUsage = customer.creditLimit > 0 ? (customer.outstandingBalance / customer.creditLimit) * 100 : 0;
    const isOverLimit = customer.isOverLimit;
    const isOverdue = customer.debtStatus === 'overdue';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.03] flex flex-row items-center justify-between">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Target className="h-4 w-4 text-primary" />
                        </div>
                        État Financier Souverain
                    </CardTitle>
                    {isOverdue && <Badge variant="destructive" className="animate-pulse font-black uppercase text-[8px] tracking-widest px-3">Retard Critique</Badge>}
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    {/* Total Spent */}
                    <div className="flex items-center justify-between p-6 bg-background/40 rounded-[2rem] border border-white/5 shadow-inner group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-xl group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Flux Sortant Total</p>
                                <p className="text-2xl font-black tracking-tighter">{formatCurrency(customer.totalSpent)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Credit Health Progress */}
                    <div className={cn(
                        "p-6 rounded-[2.5rem] border-2 transition-all duration-700 space-y-5 shadow-xl relative overflow-hidden group",
                        isOverLimit ? "bg-destructive/[0.03] border-destructive animate-pulse" : "bg-primary/[0.03] border-primary/10"
                    )}>
                        {isOverLimit && <div className="absolute inset-0 bg-destructive/5 animate-pulse pointer-events-none" />}
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className={cn("h-5 w-5", isOverLimit ? "text-destructive" : "text-primary")} />
                                <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Indice de Crédit</span>
                            </div>
                            <span className={cn("text-xs font-black tracking-widest", isOverLimit ? "text-destructive" : "text-chart-quaternary")}>
                                {customer.creditLimit > 0 ? `${Math.round(creditUsage)}% ENGAGÉ` : 'ILLIMITÉ'}
                            </span>
                        </div>
                        
                        {customer.creditLimit > 0 && (
                            <div className="space-y-3 relative z-10">
                                <Progress value={Math.min(creditUsage, 100)} className={cn("h-3 rounded-full bg-white/10 border border-white/5", isOverLimit ? "[&>div]:bg-destructive shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "[&>div]:bg-chart-quaternary")} />
                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-40">
                                    <span>Consommé: {formatCurrency(customer.outstandingBalance)}</span>
                                    <span>Plafond: {formatCurrency(customer.creditLimit)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Balance - Large Callout */}
                    <div className={cn(
                        "flex items-center justify-between p-8 rounded-[2.5rem] border-2 transition-all duration-500 shadow-2xl group",
                        customer.outstandingBalance > 0 ? "bg-destructive/10 border-destructive/20 hover:border-destructive/40" : "bg-chart-quaternary/10 border-chart-quaternary/20 hover:border-chart-quaternary/40"
                    )}>
                        <div className="space-y-1.5">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Solde Débiteur</p>
                            <p className={cn("text-4xl font-black tracking-tighter", customer.outstandingBalance > 0 ? "text-destructive" : "text-chart-quaternary")}>
                                {formatCurrency(customer.outstandingBalance)}
                            </p>
                        </div>
                        <div className={cn(
                            "p-5 rounded-[1.5rem] transition-transform group-hover:scale-110 duration-500 shadow-xl", 
                            customer.outstandingBalance > 0 ? "bg-destructive/20 text-destructive shadow-destructive/10" : "bg-chart-quaternary/20 text-chart-quaternary shadow-chart-quaternary/10"
                        )}>
                            <Wallet className="h-8 w-8" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Hourglass, ShieldCheck, Wallet, TrendingUp, Target } from 'lucide-react';
import type { Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Progress } from '../ui/progress';

interface CustomerMetricsProps {
    customer: Customer;
}

export function CustomerMetrics({ customer }: CustomerMetricsProps) {
    const creditUsage = customer.creditLimit > 0 ? (customer.outstandingBalance / customer.creditLimit) * 100 : 0;
    const isOverLimit = customer.isOverLimit;

    return (
        <div className="space-y-6">
            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <Target className="h-4 w-4 text-primary" />
                        État Financier
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-background/40 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Flux Sortant Total</p>
                                <p className="text-xl font-black tracking-tight">{formatCurrency(customer.totalSpent)}</p>
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "p-5 rounded-3xl border-2 transition-all duration-500 space-y-4",
                        isOverLimit ? "bg-destructive/5 border-destructive animate-pulse" : "bg-primary/5 border-primary/20"
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className={cn("h-5 w-5", isOverLimit ? "text-destructive" : "text-primary")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Santé Crédit</span>
                            </div>
                            <span className={cn("text-[10px] font-black", isOverLimit ? "text-destructive" : "text-chart-quaternary")}>
                                {customer.creditLimit > 0 ? `${Math.round(creditUsage)}%` : 'Illimité'}
                            </span>
                        </div>
                        
                        {customer.creditLimit > 0 && (
                            <div className="space-y-2">
                                <Progress value={Math.min(creditUsage, 100)} className={cn("h-2.5 rounded-full bg-white/10", isOverLimit ? "[&>div]:bg-destructive" : "[&>div]:bg-chart-quaternary")} />
                                <div className="flex justify-between text-[8px] font-black uppercase opacity-50">
                                    <span>Engagé: {formatCurrency(customer.outstandingBalance)}</span>
                                    <span>Limite: {formatCurrency(customer.creditLimit)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "flex items-center justify-between p-6 rounded-[2rem] border transition-all shadow-2xl",
                        customer.outstandingBalance > 0 ? "bg-destructive/10 border-destructive/20" : "bg-chart-quaternary/10 border-chart-quaternary/20"
                    )}>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Solde Restant</p>
                            <p className={cn("text-3xl font-black tracking-tighter", customer.outstandingBalance > 0 ? "text-destructive" : "text-chart-quaternary")}>
                                {formatCurrency(customer.outstandingBalance)}
                            </p>
                        </div>
                        <div className={cn("p-4 rounded-2xl", customer.outstandingBalance > 0 ? "bg-destructive/20 text-destructive" : "bg-chart-quaternary/20 text-chart-quaternary")}>
                            <Wallet className="h-6 w-6" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

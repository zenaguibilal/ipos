
'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Landmark, Banknote, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ZakatCalculatorFormProps {
    zakatData: any;
    zakatInputs: any;
    setZakatInputs: (inputs: any) => void;
    isInitialLoading: boolean;
}

export function ZakatCalculatorForm({ zakatData, zakatInputs, setZakatInputs, isInitialLoading }: ZakatCalculatorFormProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden group shadow-2xl hover:border-primary/20 transition-all">
                <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        Composantes des Actifs
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-background/40 border border-white/5 shadow-inner">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1.5 tracking-widest opacity-60">Valorisation des Stocks</Label>
                            <p className="text-2xl font-black tracking-tighter">
                                {isInitialLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(zakatData.inventoryValue)}
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-background/40 border border-white/5 shadow-inner">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1.5 tracking-widest opacity-60">Créances Clients Actives</Label>
                            <p className="text-2xl font-black tracking-tighter text-emerald-500">
                                {isInitialLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(zakatData.customerDebts)}
                            </p>
                        </div>
                    </div>
                    <Separator className="bg-white/5" />
                    <div className="space-y-4">
                        <Label htmlFor="cash" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Cash en Caisse (DA)</Label>
                        <div className="relative group">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                            <Input 
                                id="cash" 
                                type="number" 
                                value={zakatInputs.cashOnHand || ''} 
                                onChange={(e) => setZakatInputs({ cashOnHand: Number(e.target.value) })} 
                                className="h-16 pl-12 text-2xl font-black bg-background/60 rounded-2xl border-white/10 focus:border-primary/40 shadow-inner" 
                                placeholder="0.00" 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden group shadow-2xl hover:border-destructive/20 transition-all">
                <CardHeader className="bg-destructive/5 border-b border-white/5 p-8">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-4 text-destructive">
                        <Landmark className="h-4 w-4" />
                        Passifs & Déductions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="p-5 rounded-2xl bg-background/40 border border-white/5 shadow-inner">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground block mb-1.5 tracking-widest opacity-60">Dettes Fournisseurs</Label>
                        <p className="text-2xl font-black tracking-tighter text-destructive">
                            {isInitialLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(zakatData.supplierDebts)}
                        </p>
                    </div>
                    <Separator className="bg-white/5" />
                    <div className="space-y-4">
                        <Label htmlFor="other-debts" className="text-[10px] font-black uppercase tracking-widest opacity-70 ml-1">Autres Dettes / Charges (DA)</Label>
                        <div className="relative group">
                            <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive/30 group-focus-within:text-destructive transition-colors" />
                            <Input 
                                id="other-debts" 
                                type="number" 
                                value={zakatInputs.otherDebts || ''} 
                                onChange={(e) => setZakatInputs({ otherDebts: Number(e.target.value) })} 
                                className="h-16 pl-12 text-2xl font-black bg-background/60 rounded-2xl border-white/10 focus:border-destructive/40 shadow-inner" 
                                placeholder="0.00" 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

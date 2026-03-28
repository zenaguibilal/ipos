'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrder } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { User, Package, CheckCircle2, Clock, AlertCircle, ShoppingBag, Truck, Banknote, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';

interface BreadOrderCardProps {
    order: BreadOrder;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const breadPrice = useAppStore(state => state.profile?.prix_pain) || 0;
    const [quantity, setQuantity] = useState(order.quantite);
    const debouncedQuantity = useDebounce(quantity, 500);

    const isPaid = !!order.venteUuid || order.est_paye;
    const isDelivered = order.est_livre;

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        if (!isManagerOrAdmin) return;
        try {
            await api.put(`bread/${order.uuid}`, { quantite: newQuantity });
            onUpdate();
        } catch (error) {
            toast.error("Erreur de mise à jour.");
        }
    }, [order.uuid, onUpdate, isManagerOrAdmin]);

    useEffect(() => {
        if (debouncedQuantity !== order.quantite && !isPaid && isManagerOrAdmin) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantite, handleQuantityChange, isPaid, isManagerOrAdmin]);
    
    useEffect(() => {
        setQuantity(order.quantite);
    }, [order.quantite]);

    const handleDeliveryToggle = useCallback(async (delivered: boolean) => {
        if (!isManagerOrAdmin) return;
        try {
            await api.put(`bread/${order.uuid}`, { est_livre: delivered });
            onUpdate();
            toast.success(delivered ? "Livraison confirmée" : "Livraison annulée");
        } catch (error) {
            toast.error("Erreur de mise à jour du statut.");
        }
    }, [order.uuid, onUpdate, isManagerOrAdmin]);
    
    return (
        <Card className={cn(
            "flex flex-col transition-all duration-500 border-2 overflow-hidden luxury-glass group/card relative", 
            isSelected ? "border-primary shadow-2xl scale-[1.03] bg-primary/10 z-10" : "border-white/5 bg-muted/10 hover:border-primary/20",
            isPaid && "border-chart-quaternary/30 opacity-90 grayscale-[0.3]",
            !isDelivered && !isPaid && "border-primary/5"
        )}>
            {/* Background Glow for Selected */}
            {isSelected && <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />}
            
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-[0.03] transition-opacity pointer-events-none duration-700">
                <ShoppingCart className="h-24 w-24 rotate-12" />
            </div>

            <CardHeader className="flex-row items-center justify-between p-5 pb-4 relative z-10">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl shrink-0 transition-all duration-500 shadow-inner flex items-center justify-center font-black text-xl",
                        isPaid ? "bg-chart-quaternary/20 text-chart-quaternary" : "bg-primary/10 text-primary"
                    )}>
                        {order.orderName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                        <CardTitle className="text-sm truncate font-black uppercase tracking-tight group-hover/card:text-primary transition-colors" title={order.orderName}>
                            {order.orderName}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {order.customerUuid ? (
                                <Badge variant="outline" className="text-[7px] h-4 font-black bg-primary/5 border-primary/20 text-primary uppercase tracking-widest">Compte iPOS</Badge>
                            ) : (
                                <Badge variant="outline" className="text-[7px] h-4 font-black bg-muted border-white/10 text-muted-foreground uppercase tracking-widest">Passage</Badge>
                            )}
                            {isPaid && <Badge className="text-[7px] h-4 bg-chart-quaternary text-white border-0 font-black uppercase tracking-widest">M.A.C</Badge>}
                        </div>
                    </div>
                </div>
                {!isPaid && (
                    <div className={cn(
                        "transition-opacity duration-300",
                        isSelected ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
                    )}>
                        <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => onToggleSelection(order.uuid)} 
                            disabled={!isManagerOrAdmin} 
                            className="h-6 w-6 rounded-lg border-primary/30 data-[state=checked]:bg-primary shadow-lg"
                        />
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-5 pt-0 relative z-10 flex-grow space-y-4">
                <div className="flex items-center justify-between bg-background/40 p-4 rounded-2xl border border-white/5 shadow-inner group/input hover:border-primary/20 transition-all">
                    <Label htmlFor={`qty-${order.uuid}`} className="flex flex-col text-[10px] uppercase font-black tracking-widest text-muted-foreground select-none">
                        <span className="flex items-center gap-2"><Package className="h-3 w-3 text-primary/40"/> Volume</span>
                        <span className="text-[8px] opacity-40 mt-0.5">{formatCurrency(quantity * breadPrice)}</span>
                    </Label>
                    <div className="flex items-center gap-3">
                        <Input 
                            id={`qty-${order.uuid}`}
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-20 h-10 text-center text-lg font-black bg-muted/50 border-white/10 focus:border-primary/50 rounded-xl shadow-sm"
                            disabled={isPaid || !isManagerOrAdmin}
                        />
                        {order.quantite_origine !== undefined && order.quantite !== order.quantite_origine && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="p-1.5 bg-orange-500/10 rounded-lg animate-pulse cursor-help">
                                            <AlertCircle className="h-4 w-4 text-orange-500" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="luxury-glass border-orange-500/20">
                                        <p className="text-[10px] font-bold uppercase">Ajustement Manuel (Initial: {order.quantite_origine})</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-0 border-t border-white/5 bg-white/[0.02] mt-auto">
                <div className="grid grid-cols-2 w-full divide-x divide-white/5 h-16">
                    <button 
                        onClick={() => !isPaid && isManagerOrAdmin && handleDeliveryToggle(!isDelivered)}
                        disabled={isPaid || !isManagerOrAdmin}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 transition-all group/btn",
                            isDelivered ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5 text-muted-foreground opacity-60",
                            !isManagerOrAdmin && "cursor-not-allowed"
                        )}
                    >
                        {isDelivered ? <CheckCircle2 className="h-4 w-4 animate-in zoom-in-50" /> : <Truck className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{isDelivered ? 'Livré' : 'À Livrer'}</span>
                    </button>
                    <div className={cn(
                        "flex flex-col items-center justify-center gap-1.5 transition-all",
                        isPaid ? "bg-chart-quaternary/10 text-chart-quaternary" : "text-muted-foreground opacity-40"
                    )}>
                        {isPaid ? (
                            <>
                                <ShieldCheck className="h-4 w-4 animate-in zoom-in-50" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Facturé S.</span>
                            </>
                        ) : (
                            <>
                                <Clock className="h-4 w-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Attente MAC</span>
                            </>
                        )}
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { User, Package, CheckCircle2, Clock, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface BreadOrderCardProps {
    order: BreadOrder;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();
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
        } catch (error) {
            toast.error("Erreur de mise à jour du statut.");
        }
    }, [order.uuid, onUpdate, isManagerOrAdmin]);
    
    return (
        <Card className={cn(
            "flex flex-col transition-all duration-500 border-2 overflow-hidden luxury-glass", 
            isSelected ? "border-primary shadow-2xl scale-[1.03] bg-primary/10 z-10" : "border-white/5 bg-muted/10 hover:border-white/20",
            isPaid && "border-chart-quaternary/30 opacity-90 grayscale-[0.3]",
            !isDelivered && !isPaid && "border-primary/5"
        )}>
            <CardHeader className="flex-row items-center justify-between p-5 pb-4">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl shrink-0 transition-all duration-500 shadow-inner flex items-center justify-center font-black text-lg",
                        isPaid ? "bg-chart-quaternary/20 text-chart-quaternary" : "bg-primary/10 text-primary"
                    )}>
                        {order.orderName.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-sm truncate font-black uppercase tracking-tight" title={order.orderName}>
                            {order.orderName}
                        </CardTitle>
                        {order.customerUuid ? (
                            <Badge variant="outline" className="text-[8px] h-4 py-0 font-black bg-primary/5 border-primary/20 text-primary uppercase tracking-tighter">Compte iPOS</Badge>
                        ) : (
                            <Badge variant="outline" className="text-[8px] h-4 py-0 font-black bg-muted border-white/10 text-muted-foreground uppercase tracking-tighter">Passage</Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isPaid && (
                        <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => onToggleSelection(order.uuid)} 
                            disabled={!isManagerOrAdmin} 
                            className="h-6 w-6 rounded-lg border-primary/30 data-[state=checked]:bg-primary shadow-lg"
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
                <div className="flex items-center justify-between bg-background/40 p-4 rounded-2xl mt-1 border border-white/5 shadow-inner group/input">
                    <Label htmlFor={`qty-${order.uuid}`} className="flex items-center gap-2.5 text-[10px] uppercase font-black tracking-widest text-muted-foreground select-none">
                        <Package className="h-3.5 w-3.5 text-primary/40 group-hover/input:text-primary transition-colors"/> Volume
                    </Label>
                    <div className="flex items-center gap-3">
                        <Input 
                            id={`qty-${order.uuid}`}
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-20 h-10 text-center text-lg font-black bg-muted/50 border-white/10 focus:border-primary/50 rounded-xl"
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
                                        <p className="text-[10px] font-bold uppercase">Modification manuelle (Init: {order.quantite_origine})</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-0 border-t border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-2 w-full divide-x divide-white/5 h-16">
                    <button 
                        onClick={() => !isPaid && isManagerOrAdmin && handleDeliveryToggle(!isDelivered)}
                        disabled={isPaid || !isManagerOrAdmin}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1.5 transition-all group/btn",
                            isDelivered ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground opacity-60",
                            !isManagerOrAdmin && "cursor-not-allowed"
                        )}
                    >
                        {isDelivered ? <CheckCircle2 className="h-4.5 w-4.5 animate-in zoom-in-50" /> : <Truck className="h-4.5 w-4.5 group-hover/btn:translate-x-1 transition-transform" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{isDelivered ? 'Livré' : 'À Livrer'}</span>
                    </button>
                    <div className={cn(
                        "flex flex-col items-center justify-center gap-1.5 transition-all",
                        isPaid ? "bg-chart-quaternary/10 text-chart-quaternary" : "text-muted-foreground opacity-40"
                    )}>
                        {isPaid ? <ShoppingBag className="h-4.5 w-4.5 animate-in zoom-in-50" /> : <Clock className="h-4.5 w-4.5" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{isPaid ? 'M.A.C' : 'En attente'}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}

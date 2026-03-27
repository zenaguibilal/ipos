
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
import { User, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
            "flex flex-col transition-all duration-300 border-2 overflow-hidden", 
            isSelected ? "border-primary shadow-xl scale-[1.02] bg-primary/5" : "border-white/5 bg-muted/20",
            isPaid && "border-chart-quaternary/30 opacity-90",
            !isDelivered && !isPaid && "border-orange-500/20"
        )}>
            <CardHeader className="flex-row items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                        "p-2 rounded-xl shrink-0 transition-colors",
                        isPaid ? "bg-chart-quaternary/20 text-chart-quaternary" : "bg-primary/10 text-primary"
                    )}>
                        <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="text-sm truncate font-black uppercase tracking-tight" title={order.orderName}>
                            {order.orderName}
                        </CardTitle>
                        {order.customerUuid && (
                            <Badge variant="outline" className="text-[8px] h-4 py-0 font-bold bg-background/50 border-primary/20 text-primary/70">Client Fidèle</Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => onToggleSelection(order.uuid)} 
                        disabled={isPaid || !isManagerOrAdmin} 
                        className="h-5 w-5 rounded-md border-primary/30 data-[state=checked]:bg-primary"
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between bg-background/40 p-3 rounded-xl mt-1 border border-white/5">
                    <Label htmlFor={`qty-${order.uuid}`} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground select-none">
                        <Package className="h-3 w-3"/> Qté Livrée
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id={`qty-${order.uuid}`}
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center text-sm font-black bg-muted border-white/10 focus:border-primary/50"
                            disabled={isPaid || !isManagerOrAdmin}
                        />
                        {order.quantite_origine !== undefined && order.quantite !== order.quantite_origine && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertCircle className="h-3.5 w-3.5 text-orange-500 animate-pulse cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="luxury-glass"><p>Quantité modifiée (Initial: {order.quantite_origine})</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-0 border-t border-white/5 bg-black/5">
                <div className="grid grid-cols-2 w-full divide-x divide-white/5">
                    <button 
                        onClick={() => !isPaid && isManagerOrAdmin && handleDeliveryToggle(!isDelivered)}
                        disabled={isPaid || !isManagerOrAdmin}
                        className={cn(
                            "flex flex-col items-center gap-1.5 py-3 transition-all",
                            isDelivered ? "bg-primary/10 text-primary" : "hover:bg-white/5 text-muted-foreground opacity-60",
                            !isManagerOrAdmin && "cursor-not-allowed"
                        )}
                    >
                        {isDelivered ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span className="text-[9px] font-black uppercase tracking-tighter">{isDelivered ? 'LIVRÉ' : 'À LIVRER'}</span>
                    </button>
                    <div className={cn(
                        "flex flex-col items-center gap-1.5 py-3 transition-all",
                        isPaid ? "bg-chart-quaternary/10 text-chart-quaternary" : "text-muted-foreground opacity-40"
                    )}>
                        {isPaid ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        <span className="text-[9px] font-black uppercase tracking-tighter">{isPaid ? 'FACTURÉ' : 'À FACTURER'}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}

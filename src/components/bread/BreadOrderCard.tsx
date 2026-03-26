
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { AlertTriangle, User, Package, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface BreadOrderCardProps {
    order: BreadOrder;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantite);
    const debouncedQuantity = useDebounce(quantity, 500);

    const isPaid = order.est_paye;
    const isDelivered = order.est_livre;

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        try {
            await breadService.updateOrder(order.uuid, { quantite: newQuantity });
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la quantité.");
        }
    }, [order.uuid, onUpdate]);

    useEffect(() => {
        if (debouncedQuantity !== order.quantite) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantite, handleQuantityChange]);
    
    useEffect(() => {
        setQuantity(order.quantite);
    }, [order.quantite]);

    const handleDeliveryToggle = useCallback(async (delivered: boolean) => {
        try {
            await breadService.updateOrder(order.uuid, { est_livre: delivered });
            onUpdate();
        } catch (error) {
            toast.error("Erreur de mise à jour.");
        }
    }, [order.uuid, onUpdate]);
    
    return (
        <Card className={cn(
            "flex flex-col transition-all duration-200 border-2", 
            isSelected && "border-primary shadow-lg scale-[1.02]",
            !isSelected && "border-transparent",
            isPaid ? "bg-green-500/5" : "bg-card"
        )}>
            <CardHeader className="flex-row items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <CardTitle className="text-base truncate font-bold">{order.orderName}</CardTitle>
                </div>
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={() => onToggleSelection(order.uuid)} 
                    disabled={isPaid} 
                    className="h-5 w-5"
                />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg mt-2">
                    <Label htmlFor={`qty-${order.uuid}`} className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                        <Package className="h-3 w-3"/> Quantité
                    </Label>
                    <Input 
                        id={`qty-${order.uuid}`}
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-center text-base font-bold bg-background"
                        disabled={isPaid}
                    />
                </div>
            </CardContent>
            <CardFooter className="p-2 grid grid-cols-2 gap-2 border-t mt-auto bg-background/50">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Paiement</span>
                    <div className="flex items-center gap-2">
                        <Switch id={`paid-${order.uuid}`} checked={isPaid} disabled />
                        <span className={cn("text-xs font-bold", isPaid ? "text-green-500" : "text-muted-foreground")}>{isPaid ? 'PAYÉ' : 'À PAYER'}</span>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1 border-l">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Livraison</span>
                    <div className="flex items-center gap-2">
                        <Switch id={`delivered-${order.uuid}`} checked={isDelivered} onCheckedChange={handleDeliveryToggle} />
                        <span className={cn("text-xs font-bold", isDelivered ? "text-primary" : "text-muted-foreground")}>{isDelivered ? 'LIVRÉ' : 'EN ATTENTE'}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}

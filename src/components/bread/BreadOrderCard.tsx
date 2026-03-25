'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrderWithClient } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { breadService } from '@/services/bread.service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface BreadOrderCardProps {
    order: BreadOrderWithClient;
    isSelected: boolean;
    onToggleSelection: (orderId: string) => void;
    onUpdate: () => void;
}

export function BreadOrderCard({ order, isSelected, onToggleSelection, onUpdate }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantite);
    const debouncedQuantity = useDebounce(quantity, 500);

    const isModified = order.quantite_origine !== undefined && order.quantite !== order.quantite_origine;
    const isPaid = order.est_paye;
    const isDelivered = order.est_livre;

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        try {
            await breadService.updateBreadOrderQuantity(order.uuid, newQuantity);
            toast.success(`Quantité mise à jour pour ${order.client.nom}.`);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la quantité.");
        }
    }, [order.uuid, order.client.nom, onUpdate]);

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
            await breadService.updateBreadOrderDeliveryStatus(order.uuid, delivered);
            toast.success(`Statut de livraison mis à jour pour ${order.client.nom}`);
            onUpdate();
        } catch (error) {
            toast.error("Erreur lors de la mise à jour du statut de livraison.");
        }
    }, [order.uuid, order.client.nom, onUpdate]);
    
    return (
        <Card className={cn(
            "flex flex-col transition-all duration-200", 
            isSelected && "ring-2 ring-primary", 
            isPaid ? "bg-green-500/10" : "bg-card"
        )}>
            <CardHeader className="flex-row items-center justify-between p-4">
                <CardTitle className="text-lg">{order.client.nom}</CardTitle>
                <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(order.uuid)} disabled={isPaid} />
            </CardHeader>
            <CardContent className="flex-grow p-4 pt-0">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`qty-${order.uuid}`}>Quantité</Label>
                    <Input 
                        id={`qty-${order.uuid}`}
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                        className="w-24 h-9 text-center text-lg font-bold"
                        disabled={isPaid}
                    />
                </div>
                 {isModified && (
                    <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Quantité modifiée (origine: {order.quantite_origine})
                    </div>
                 )}
            </CardContent>
            <CardFooter className="p-2 grid grid-cols-2 gap-2 border-t mt-auto bg-background/30">
                <div className="flex items-center justify-center space-x-2 p-2 rounded-md">
                    <Switch 
                        id={`paid-${order.uuid}`} 
                        checked={isPaid} 
                        disabled 
                    />
                    <Label htmlFor={`paid-${order.uuid}`} className={cn("transition-colors", isPaid && "text-primary font-semibold")}>Payé</Label>
                </div>
                <div className="flex items-center justify-center space-x-2 p-2 rounded-md">
                    <Switch 
                        id={`delivered-${order.uuid}`} 
                        checked={isDelivered} 
                        onCheckedChange={handleDeliveryToggle} 
                    />
                    <Label htmlFor={`delivered-${order.uuid}`} className={cn("transition-colors", isDelivered && "text-chart-quaternary font-semibold")}>Livré</Label>
                </div>
            </CardFooter>
        </Card>
    );
}

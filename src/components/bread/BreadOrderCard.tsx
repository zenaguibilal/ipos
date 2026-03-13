'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadOrder, BreadOrderWithClient } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { dataService } from '@/services/data-service';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebounce } from '@/hooks/useDebounce';
import { AlertTriangle, BookMarked, Check, CheckCircle, ChevronDown, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';


interface BreadOrderCardProps {
    order: BreadOrderWithClient;
    isSelected: boolean;
    onToggleSelection: (orderId: number) => void;
}

const statusConfig: Record<BreadOrder['statut'], { label: string, color: string, icon: React.ElementType }> = {
    en_attente: { label: 'En attente', color: 'bg-gray-500 hover:bg-gray-600', icon: X },
    livre: { label: 'Livré', color: 'bg-blue-500 hover:bg-blue-600', icon: Check },
    paye: { label: 'Payé (non livré)', color: 'bg-yellow-500 hover:bg-yellow-600 text-black', icon: BookMarked },
    finalise: { label: 'Payé & Livré', color: 'bg-green-500 hover:bg-green-600', icon: CheckCircle },
};


export function BreadOrderCard({ order, isSelected, onToggleSelection }: BreadOrderCardProps) {
    const [quantity, setQuantity] = useState(order.quantite);
    const debouncedQuantity = useDebounce(quantity, 500);

    const isModified = order.quantite_origine !== undefined && order.quantite !== order.quantite_origine;
    const isPaid = !!order.vente_id;

    const handleQuantityChange = useCallback(async (newQuantity: number) => {
        try {
            await dataService.updateBreadOrderQuantity(order.id!, newQuantity);
            toast.success(`Quantité mise à jour pour ${order.client.nom}.`);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la quantité.");
        }
    }, [order.id, order.client.nom]);

    useEffect(() => {
        if (debouncedQuantity !== order.quantite) {
            handleQuantityChange(debouncedQuantity);
        }
    }, [debouncedQuantity, order.quantite, handleQuantityChange]);
    
    useEffect(() => {
        setQuantity(order.quantite);
    }, [order.quantite]);

    const handleStatusChange = useCallback(async (newStatus: BreadOrder['statut']) => {
        if (newStatus === order.statut) return;
        try {
            await dataService.updateBreadOrderStatus(order.id!, newStatus);
            toast.success(`Statut mis à jour pour ${order.client.nom}`);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour du statut.");
        }
    }, [order.id, order.statut, order.client.nom]);
    
    const CurrentIcon = statusConfig[order.statut].icon;

    return (
        <Card className={cn("flex flex-col transition-all duration-200", isSelected && "ring-2 ring-primary", isPaid && "opacity-60")}>
            <CardHeader className="flex-row items-center justify-between p-4">
                <CardTitle className="text-lg">{order.client.nom}</CardTitle>
                <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(order.id!)} disabled={isPaid} />
            </CardHeader>
            <CardContent className="flex-grow p-4 pt-0">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`qty-${order.id}`}>Quantité</Label>
                    <Input 
                        id={`qty-${order.id}`}
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
            <CardFooter className="p-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className={cn("w-full justify-between", statusConfig[order.statut].color)}>
                            <span className="flex items-center">
                                <CurrentIcon className="mr-2 h-4 w-4" />
                                {statusConfig[order.statut].label}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        {Object.entries(statusConfig).map(([statusKey, config]) => (
                            <DropdownMenuItem 
                                key={statusKey} 
                                onClick={() => handleStatusChange(statusKey as BreadOrder['statut'])}
                                disabled={order.statut === statusKey}
                            >
                                <config.icon className="mr-2 h-4 w-4" />
                                {config.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}

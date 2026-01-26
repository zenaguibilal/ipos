
'use client';

import type { BreadCustomer, BreadOrder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

interface BreadOrderRowProps {
    order: BreadOrder;
    isSelected: boolean;
    onSelectionChange: (checked: boolean) => void;
    onUpdateStatus: (order: BreadOrder, field: 'isPaid' | 'isDelivered', value: boolean) => void;
    onEditOrder: (order: BreadOrder) => void;
    onEditCustomer: (customer: BreadCustomer) => void;
    onDeleteCustomer: (customer: BreadCustomer) => void;
    isProcessing: boolean;
}

export function BreadOrderRow({ order, isSelected, onSelectionChange, onUpdateStatus, onEditOrder, onEditCustomer, onDeleteCustomer, isProcessing }: BreadOrderRowProps) {
    const dailyOrder = order.todaysOrder;
    const displayQuantity = dailyOrder?.quantity ?? order.defaultOrderQuantity;

    const handleCheckedChange = (checked: boolean | 'indeterminate') => {
        onSelectionChange(Boolean(checked));
    }

    return (
        <Card className={cn("transition-all duration-200", isSelected ? "bg-muted border-primary" : "bg-card")}>
            <div className="flex items-center p-3 gap-3">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={handleCheckedChange}
                    aria-label={`Select order for ${order.name}`}
                    className="m-2"
                />
                <div className="flex-1">
                    <p className="font-semibold">{order.name}</p>
                    <div className="flex items-center gap-2">
                         <span className="text-primary font-bold text-lg">{displayQuantity}</span>
                        {!dailyOrder && <Repeat className="h-4 w-4 text-muted-foreground" title="Quantité par défaut" />}
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center space-x-2">
                        <Label htmlFor={`paid-${order.id}`} className="text-sm">Payé</Label>
                        <Switch
                            id={`paid-${order.id}`}
                            checked={dailyOrder?.isPaid ?? false}
                            onCheckedChange={(value) => onUpdateStatus(order, 'isPaid', value)}
                            disabled={isProcessing}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor={`delivered-${order.id}`} className="text-sm">Livré</Label>
                         <Switch
                            id={`delivered-${order.id}`}
                            checked={dailyOrder?.isDelivered ?? false}
                            onCheckedChange={(value) => onUpdateStatus(order, 'isDelivered', value)}
                            disabled={isProcessing}
                        />
                    </div>
                </div>
                <div className="ml-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessing}>
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditOrder(order)}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier la quantité
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditCustomer(order as BreadCustomer)}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier le client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteCustomer(order as BreadCustomer)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer le client
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </Card>
    );
}


'use client';

import React from 'react';
import type { BreadOrder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MoreVertical, Edit, Trash2, RefreshCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface BreadOrderCardProps {
  order: BreadOrder;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (field: 'isPaid' | 'isDelivered', value: boolean) => void;
  isUpdating: boolean;
  isPriceSet: boolean;
}

const BreadOrderCardComponent: React.FC<BreadOrderCardProps> = ({
  order, isSelected, onSelect, onEdit, onDelete,
  onUpdateStatus, isUpdating, isPriceSet
}) => {

  const quantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
  const isPaid = order.todaysOrder?.isPaid ?? false;
  const isDelivered = order.todaysOrder?.isDelivered ?? false;
  const isModified = order.todaysOrder && order.todaysOrder.quantity !== order.defaultOrderQuantity;

  return (
    <Card className={cn("flex flex-col transition-all duration-300", isSelected && "ring-2 ring-primary", isUpdating && "opacity-50 pointer-events-none")}>
        <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex items-center gap-3">
                <Checkbox checked={isSelected} onCheckedChange={onSelect} aria-label={`Select ${order.name}`}/>
                <CardTitle className="text-lg">{order.name}</CardTitle>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Modifier la quantité</DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer le client</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
                <div className="text-4xl font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={onEdit}>
                    {quantity}
                </div>
                 <div className="flex flex-col items-end gap-1">
                     {isModified && (
                        <Badge variant="outline" className="text-xs">Modifié</Badge>
                    )}
                    {order.todaysOrder?.saleId && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Vendu</Badge>
                    )}
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`paid-${order.id}`} className={cn("text-base", !isPriceSet && "text-muted-foreground", isPaid && "font-semibold")}>Payé</Label>
                    <Switch id={`paid-${order.id}`} checked={isPaid} onCheckedChange={(value) => onUpdateStatus('isPaid', value)} disabled={isUpdating || !isPriceSet || !!order.todaysOrder?.saleId} />
                </div>
                 <div className="flex items-center justify-between">
                    <Label htmlFor={`delivered-${order.id}`} className={cn("text-base", isDelivered && "font-semibold")}>Livré</Label>
                    <Switch id={`delivered-${order.id}`} checked={isDelivered} onCheckedChange={(value) => onUpdateStatus('isDelivered', value)} disabled={isUpdating} />
                </div>
            </div>
        </CardContent>
    </Card>
  );
}

export default React.memo(BreadOrderCardComponent);

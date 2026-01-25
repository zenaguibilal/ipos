
'use client';

import type { BreadOrder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MoreVertical, Trash2, Repeat, Edit, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';


interface OrderCardProps {
    order: BreadOrder;
    onUpdateToggles: (id: string, field: 'isPaid' | 'isDelivered', value: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    isSelected: boolean;
    onSelectChange: (checked: boolean) => void;
    isUpdating?: boolean;
}

export function OrderCard({ order, onUpdateToggles, onEdit, onDelete, isSelected, onSelectChange, isUpdating }: OrderCardProps) {
    const getStatus = () => {
        if (order.isDelivered) {
            if (order.isPaid) {
                return { text: 'Terminé', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 border-transparent text-primary-foreground' };
            }
            return { text: 'Dû', variant: 'destructive' as const, className: '' };
        }
        return { text: 'En attente', variant: 'secondary' as const, className: '' };
    };
    const status = getStatus();

    return (
        <Card className={cn(
            "flex flex-col justify-between transition-all relative hover:shadow-xl hover:-translate-y-1",
            isSelected && "border-primary ring-2 ring-primary"
        )}>
             {isUpdating && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            )}
             <div className="absolute top-2 left-2 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onSelectChange}
                    aria-label={`Sélectionner la commande de ${order.name}`}
                    className="h-5 w-5 bg-background border-border"
                    disabled={isUpdating}
                />
            </div>
            <CardHeader className="flex-row items-start justify-between pb-2 pt-3 pl-10">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{order.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <span className="text-2xl font-black text-primary">{order.quantity}</span>
                        {order.isRecurring && <span title="Commande récurrente"><Repeat className="h-4 w-4" /></span>}
                    </div>
                </div>
                 <div className="flex flex-col items-end gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant={status.variant} className={cn("pointer-events-none", status.className)}>
                        {status.text}
                    </Badge>
                </div>
            </CardHeader>
            <CardFooter className="flex-col items-stretch gap-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`paid-${order.id}`} className="text-sm font-medium">
                        Payé
                    </Label>
                    <Switch
                        id={`paid-${order.id}`}
                        checked={order.isPaid}
                        onCheckedChange={(checked) => onUpdateToggles(order.id, 'isPaid', checked)}
                        aria-label="Marquer comme payé"
                        disabled={isUpdating}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor={`delivered-${order.id}`} className="text-sm font-medium">
                        Livré
                    </Label>
                    <Switch
                        id={`delivered-${order.id}`}
                        checked={order.isDelivered}
                        onCheckedChange={(checked) => onUpdateToggles(order.id, 'isDelivered', checked)}
                        aria-label="Marquer comme livré"
                        disabled={isUpdating}
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

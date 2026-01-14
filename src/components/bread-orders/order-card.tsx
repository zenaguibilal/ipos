
'use client';

import type { BreadOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MoreVertical, Trash2, Repeat, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface OrderCardProps {
    order: BreadOrder;
    onUpdateToggles: (id: string, field: 'isPaid' | 'isDelivered', value: boolean) => void;
    onEdit: () => void;
    onDelete: (id: string) => void;
}

export function OrderCard({ order, onUpdateToggles, onEdit, onDelete }: OrderCardProps) {
    return (
        <Card className={cn(
            "flex flex-col justify-between transition-colors",
            order.isDelivered && "bg-green-500/10 border-green-500/30"
        )}>
            <CardHeader className="flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{order.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                       <span className="text-2xl font-black text-primary">{order.quantity}</span>
                        {order.isRecurring && <Repeat className="h-4 w-4" title="Commande récurrente"/>}
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={onEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(order.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

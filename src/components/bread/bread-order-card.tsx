
'use client';

import type { BreadCustomer, BreadOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Repeat, GitMerge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface BreadOrderCardProps {
    order: BreadOrder;
    onEditCustomer: (customer: BreadCustomer) => void;
    onDeleteCustomer: (customer: BreadCustomer) => void;
    onSetOrder: (order: BreadOrder) => void;
}

export function BreadOrderCard({ order, onEditCustomer, onDeleteCustomer, onSetOrder }: BreadOrderCardProps) {
    
    const displayQuantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
    const isCustomOrder = !!order.todaysOrder;

    return (
        <Card className={cn(
            "flex flex-col transition-all duration-300 hover:shadow-lg",
            !order.isActive && "bg-muted/50 opacity-60"
        )}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{order.name}</CardTitle>
                        {!order.isActive && <Badge variant="secondary">Inactif</Badge>}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditCustomer(order as BreadCustomer)}>
                                <Edit className="mr-2 h-4 w-4" /> Modifier le client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteCustomer(order as BreadCustomer)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer le client
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Repeat className="h-4 w-4"/> Commande par défaut</span>
                    <span className="font-semibold">{order.defaultOrderQuantity}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><GitMerge className="h-4 w-4"/> Commande du jour</span>
                     <span className={`font-bold ${isCustomOrder ? 'text-primary' : ''}`}>{displayQuantity}</span>
                </div>
            </CardContent>
            <CardFooter className="p-0">
                <Button 
                    className="w-full rounded-t-none" 
                    variant={isCustomOrder ? 'secondary' : 'outline'}
                    onClick={() => onSetOrder(order)}
                >
                    <Edit className="mr-2 h-4 w-4" /> {isCustomOrder ? "Modifier la commande" : "Définir la commande du jour"}
                </Button>
            </CardFooter>
        </Card>
    );
}

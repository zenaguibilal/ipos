
'use client';

import React from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface SalesHistoryCardProps {
    sale: Sale;
    customerName?: string;
    onViewDetails: (sale: Sale) => void;
    onCancelSale: (sale: Sale) => void;
    onPrint: (sale: Sale) => void;
}

export const SalesHistoryCard = React.memo(({ sale, customerName, onViewDetails, onCancelSale, onPrint }: SalesHistoryCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const paymentStatusMap = {
        paid: { text: 'Payé', icon: CheckCircle, color: 'text-chart-quaternary' },
        partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary' },
        unpaid: { text: 'Impayé', icon: Clock, color: 'text-destructive' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-mono font-bold text-primary">{sale.invoiceNumber}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(safeToDate(sale.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(sale)}>
                                <FileText className="mr-2 h-4 w-4" /> Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPrint(sale)}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimer le reçu
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <DropdownMenuItem onClick={() => onCancelSale(sale)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Annuler la vente
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-semibold truncate max-w-[150px]">{customerName || 'Client de passage'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Articles</span>
                    <Badge variant="secondary" className="font-mono">{sale.items?.length || 0}</Badge>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge variant="outline" className={cn('text-[10px] uppercase font-bold py-0 h-5', status.color, status.color.replace('text-', 'border-'))}>
                        <status.icon className="mr-1 h-3 w-3" />
                        {status.text}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 rounded-b-lg border-t mt-auto">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Total</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(sale.total)}</span>
                </div>
            </CardFooter>
        </Card>
    );
});
SalesHistoryCard.displayName = 'SalesHistoryCard';

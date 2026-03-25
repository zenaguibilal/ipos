'use client';

import React from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

interface SalesHistoryCardProps {
    sale: Sale;
    customerName?: string;
    onViewDetails: (sale: Sale) => void;
    onCancelSale: (sale: Sale) => void;
}

const SalesHistoryCardComponent = ({ sale, customerName, onViewDetails, onCancelSale }: SalesHistoryCardProps) => {

    const paymentStatusMap = {
        paid: { text: 'Payé', icon: CheckCircle, color: 'text-chart-quaternary' },
        partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary' },
        unpaid: { text: 'Impayé', icon: Clock, color: 'text-destructive' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-mono">{sale.invoiceNumber}</CardTitle>
                        <CardDescription className="text-xs">{format(safeToDate(sale.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(sale)}>
                                <FileText className="mr-2 h-4 w-4" /> Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCancelSale(sale)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler la vente
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-semibold truncate">{customerName || 'Client de passage'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-semibold">{sale.items?.length || 0}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge variant="outline" className={cn('text-xs', status.color, status.color.replace('text-', 'border-'))}>
                        <status.icon className="mr-1 h-3 w-3" />
                        {status.text}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="bg-muted p-4 rounded-b-lg">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(sale.total)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export const SalesHistoryCard = React.memo(SalesHistoryCardComponent);

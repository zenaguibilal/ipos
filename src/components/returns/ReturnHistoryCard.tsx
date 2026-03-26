
'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Calendar, User, Package, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface ReturnHistoryCardProps {
    productReturn: ProductReturn;
    customerName?: string;
    onViewDetails: (pr: ProductReturn) => void;
    onCancelReturn: (pr: ProductReturn) => void;
}

export const ReturnHistoryCard = React.memo(({ productReturn, customerName, onViewDetails, onCancelReturn }: ReturnHistoryCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();

    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden luxury-glass">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-mono font-bold text-destructive">Facture #{productReturn.originalInvoiceNumber}</CardTitle>
                        <CardDescription className="text-[10px] flex items-center gap-1 uppercase tracking-wider font-bold opacity-70">
                            <Calendar className="h-3 w-3" />
                            {format(safeToDate(productReturn.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass">
                            <DropdownMenuItem onClick={() => onViewDetails(productReturn)}>
                                <FileText className="mr-2 h-4 w-4" /> Voir détails
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" /> Annuler retour
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 flex-grow text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Client</span>
                    <span className="font-bold truncate max-w-[150px]">{customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Articles</span>
                    <Badge variant="secondary" className="font-mono h-5 px-1.5">{productReturn.items.length}</Badge>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5" /> Remboursé</span>
                    <span className="font-bold text-chart-quaternary">{formatCurrency(productReturn.amountRefunded)}</span>
                </div>
            </CardContent>
            <CardFooter className="bg-destructive/5 p-4 rounded-b-lg border-t border-destructive/10 mt-auto">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] uppercase font-black tracking-widest text-destructive">Valeur Retour</span>
                    <span className="text-xl font-black text-destructive">-{formatCurrency(productReturn.totalReturnValue)}</span>
                </div>
            </CardFooter>
        </Card>
    );
});
ReturnHistoryCard.displayName = 'ReturnHistoryCard';

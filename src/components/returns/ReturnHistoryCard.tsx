'use client';

import React from 'react';
import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency } from '@/lib/utils';

interface ReturnHistoryCardProps {
    productReturn: ProductReturn;
    customerName?: string;
    onViewDetails: (pr: ProductReturn) => void;
    onCancelReturn: (pr: ProductReturn) => void;
}

const ReturnHistoryCardComponent = ({ productReturn, customerName, onViewDetails, onCancelReturn }: ReturnHistoryCardProps) => {

    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">Retour sur Facture</CardTitle>
                        <CardDescription className="text-sm font-mono">{productReturn.originalInvoiceNumber}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(productReturn)}>
                                <FileText className="mr-2 h-4 w-4" /> Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler le retour
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow text-sm">
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Date Retour</span>
                    <span className="font-semibold">{format(safeToDate(productReturn.createdAt!), 'd MMM yyyy', { locale: fr })}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-semibold truncate">{customerName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-semibold">{productReturn.items.length}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Montant Remboursé</span>
                    <span className="font-semibold">{formatCurrency(productReturn.amountRefunded)}</span>
                </div>
            </CardContent>
            <CardFooter className="bg-destructive/10 p-4 rounded-b-lg">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-destructive">Valeur du Retour</span>
                    <span className="text-lg font-bold text-destructive">{formatCurrency(productReturn.totalReturnValue)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export const ReturnHistoryCard = React.memo(ReturnHistoryCardComponent);

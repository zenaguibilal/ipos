'use client';

import type { ProductReturn } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { safeToDate } from '@/lib/utils';

interface ReturnCardProps {
    productReturn: ProductReturn;
    onViewDetails: (productReturn: ProductReturn) => void;
    onDelete: (productReturn: ProductReturn) => void;
}

export function ReturnCard({ productReturn, onViewDetails, onDelete }: ReturnCardProps) {

    return (
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{productReturn.customerName || 'N/A'}</CardTitle>
                        <CardDescription className="font-mono text-xs">Facture: {productReturn.originalInvoiceNumber}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onViewDetails(productReturn)}>
                                <FileText className="mr-2 h-4 w-4" />
                                <span>Voir les détails</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(productReturn)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Annuler & Supprimer</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Date Retour</span>
                    <span className="font-semibold">{safeToDate(productReturn.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-semibold">{productReturn.items.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Valeur</span>
                    <span className="font-semibold">{productReturn.totalReturnValue.toFixed(1)} DA</span>
                </div>
            </CardContent>
            <CardFooter className="bg-destructive/10 p-4 rounded-b-lg">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold text-destructive">Montant Remboursé</span>
                    <span className="text-lg font-bold text-destructive">-{productReturn.amountRefunded.toFixed(1)} DA</span>
                </div>
            </CardFooter>
        </Card>
    );
}

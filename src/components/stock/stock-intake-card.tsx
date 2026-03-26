'use client';

import React from 'react';
import type { StockIntake } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface StockIntakeCardProps {
    intake: StockIntake;
    supplierName?: string;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

export const StockIntakeCard = React.memo<StockIntakeCardProps>(({ intake, supplierName, onViewDetails, onCancelIntake }) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const name = supplierName || 'Fournisseur inconnu';

    return (
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{intake.invoiceNumber}</CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetails(intake)}>
                                <FileText className="mr-2 h-4 w-4" /> Voir les détails
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Annuler la réception
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Date Réception</span>
                    <span className="font-semibold">{format(safeToDate(intake.createdAt!), 'd MMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-semibold">{intake.items.length}</span>
                </div>
            </CardContent>
            <CardFooter className="bg-muted p-4 rounded-b-lg">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">Valeur Totale</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(intake.totalValue)}</span>
                </div>
            </CardFooter>
        </Card>
    );
});
StockIntakeCard.displayName = 'StockIntakeCard';

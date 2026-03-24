'use client';

import React, { useState, useEffect } from 'react';
import type { StockIntake, Supplier } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency } from '@/lib/utils';
import { dataService } from '@/services/data-service';

interface StockIntakeCardProps {
    intake: StockIntake;
    onViewDetails: (intake: StockIntake) => void;
}

export const StockIntakeCard = React.memo<StockIntakeCardProps>(({ intake, onViewDetails }) => {

    const [supplier, setSupplier] = useState<Supplier | undefined>();
    useEffect(() => {
        setSupplier(undefined);
    }, [intake.supplierId]);

    const supplierName = intake.supplierName || supplier?.name || 'Fournisseur inconnu';

    return (
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{supplierName}</CardTitle>
                        <CardDescription className="font-mono text-xs">{intake.invoiceNumber}</CardDescription>
                    </div>
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewDetails(intake)}>
                        <FileText className="h-5 w-5" />
                    </Button>
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

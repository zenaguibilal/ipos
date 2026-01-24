'use client';

import type { StockIntake } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate } from '@/lib/utils';

interface StockIntakeCardProps {
    intake: StockIntake;
    onViewDetails: (intake: StockIntake) => void;
}

export function StockIntakeCard({ intake, onViewDetails }: StockIntakeCardProps) {

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{intake.supplier}</CardTitle>
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
                    <span className="font-semibold">{format(safeToDate(intake.createdAt), 'd MMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Articles</span>
                    <span className="font-semibold">{intake.items.length}</span>
                </div>
            </CardContent>
            <CardFooter className="bg-muted p-4 rounded-b-lg">
                <div className="flex justify-between items-center w-full">
                    <span className="font-semibold">Valeur Totale</span>
                    <span className="text-lg font-bold text-primary">{intake.totalValue.toFixed(1)} DA</span>
                </div>
            </CardFooter>
        </Card>
    );
}

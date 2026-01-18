
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CircleDollarSign, CalendarClock, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomerStatsProps {
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate: Date | null;
    totalReturned: number;
}

export function CustomerStats({ totalSpent, outstandingBalance, lastActivityDate, totalReturned }: CustomerStatsProps) {
    return (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Dépensé</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSpent.toFixed(1)} DA</div>
                    <p className="text-xs text-muted-foreground">
                        Montant total de tous les achats
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valeur Retournée</CardTitle>
                    <Undo2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalReturned.toFixed(1)} DA</div>
                     <p className="text-xs text-muted-foreground">
                        Valeur totale des articles retournés
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Solde Actuel (Dette)</CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>{outstandingBalance.toFixed(1)} DA</div>
                     <p className="text-xs text-muted-foreground">
                        Montant restant à payer
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dernière Activité</CardTitle>
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {lastActivityDate ? formatDistanceToNow(lastActivityDate, { addSuffix: true, locale: fr }) : 'N/A'}
                    </div>
                     <p className="text-xs text-muted-foreground">
                        Dernière vente ou paiement
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

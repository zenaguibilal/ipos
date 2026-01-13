
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from "@/components/ui/timeline";
import { HandCoins, ShoppingCart, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn, safeToDate } from '@/lib/utils';
import type { Sale, Payment } from '@/lib/types';


interface CustomerHistoryProps {
    sales: Sale[];
    payments: Payment[];
    isLoading: boolean;
    onViewSale: (sale: Sale) => void;
}

type HistoryItem = 
    | { type: 'sale'; data: Sale; date: Date }
    | { type: 'payment'; data: Payment; date: Date };


export function CustomerHistory({ sales, payments, isLoading, onViewSale }: CustomerHistoryProps) {
    
    const combinedHistory = useMemo(() => {
        const saleItems: HistoryItem[] = sales.map(s => ({ type: 'sale', data: s, date: safeToDate(s.createdAt) }));
        const paymentItems: HistoryItem[] = payments.map(p => ({ type: 'payment', data: p, date: safeToDate(p.createdAt) }));

        return [...saleItems, ...paymentItems].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [sales, payments]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historique du client</CardTitle>
                <CardDescription>
                    Liste chronologique de toutes les ventes et de tous les paiements.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <p>Chargement de l'historique...</p>
                ) : combinedHistory.length === 0 ? (
                    <p className="text-muted-foreground">Aucune activité enregistrée pour ce client.</p>
                ) : (
                    <Timeline>
                        {combinedHistory.map((item, index) => (
                             <TimelineItem key={`${item.type}-${item.data.id}`}>
                                <TimelineConnector />
                                <TimelineHeader>
                                    <TimelineIcon>
                                        {item.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> : <HandCoins className="h-4 w-4"/>}
                                    </TimelineIcon>
                                    <TimelineTitle>
                                        {item.type === 'sale' ? `Vente - ${item.data.invoiceNumber}` : 'Paiement Enregistré'}
                                    </TimelineTitle>
                                    <div className="text-xs text-muted-foreground ml-auto">
                                        {format(item.date, 'd MMM yyyy, HH:mm', { locale: fr })}
                                    </div>
                                </TimelineHeader>
                                <TimelineBody className="ml-4">
                                     {item.type === 'sale' ? (
                                        <div className="p-3 rounded-md bg-muted/50 flex flex-col sm:flex-row justify-between items-start gap-2">
                                            <div className="space-y-1">
                                                <p className="font-semibold">{item.data.total.toFixed(2)} DA</p>
                                                <p className={cn("text-xs", item.data.paymentStatus === 'paid' && 'text-green-600', item.data.paymentStatus === 'partial' && 'text-yellow-600', item.data.paymentStatus === 'unpaid' && 'text-destructive')}>
                                                    Statut: {item.data.paymentStatus === 'paid' ? 'Payé' : item.data.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => onViewSale(item.data)}>
                                                 <FileText className="mr-2 h-4 w-4" />
                                                Voir la facture
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-md bg-muted/50">
                                            <p className="font-semibold text-green-600">
                                                + {item.data.amount.toFixed(2)} DA
                                            </p>
                                        </div>
                                    )}
                                </TimelineBody>
                            </TimelineItem>
                        ))}
                    </Timeline>
                )}
            </CardContent>
        </Card>
    );
}


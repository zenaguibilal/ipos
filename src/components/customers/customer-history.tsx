'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineIcon, TimelineTitle, TimelineBody } from "@/components/ui/timeline";
import { HandCoins, ShoppingCart, FileText, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn, safeToDate } from '@/lib/utils';
import type { Sale, Payment, ProductReturn } from '@/lib/types';


interface CustomerHistoryProps {
    sales: Sale[];
    payments: Payment[];
    returns: ProductReturn[];
    isLoading: boolean;
    onViewSale: (sale: Sale) => void;
}

type HistoryItem = 
    | { type: 'sale'; data: Sale; date: Date }
    | { type: 'payment'; data: Payment; date: Date }
    | { type: 'return'; data: ProductReturn; date: Date };


export function CustomerHistory({ sales, payments, returns, isLoading, onViewSale }: CustomerHistoryProps) {
    
    const combinedHistory = useMemo(() => {
        const saleItems: HistoryItem[] = (sales || [])
            .filter(s => s.createdAt)
            .map(s => ({ type: 'sale', data: s, date: safeToDate(s.createdAt) }));
            
        const paymentItems: HistoryItem[] = (payments || [])
            .filter(p => p.createdAt)
            .map(p => ({ type: 'payment', data: p, date: safeToDate(p.createdAt) }));

        const returnItems: HistoryItem[] = (returns || [])
            .filter(r => r.createdAt)
            .map(r => ({ type: 'return', data: r, date: safeToDate(r.createdAt) }));

        return [...saleItems, ...paymentItems, ...returnItems].sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [sales, payments, returns]);

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
                             <TimelineItem key={`${item.type}-${item.data.id}-${index}`}>
                                <TimelineConnector />
                                <TimelineHeader>
                                    <TimelineIcon className={cn(
                                        item.type === 'payment' && "bg-green-100 dark:bg-green-900",
                                        item.type === 'return' && "bg-yellow-100 dark:bg-yellow-900"
                                    )}>
                                        {item.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> : item.type === 'payment' ? <HandCoins className="h-4 w-4 text-green-600"/> : <Undo2 className="h-4 w-4 text-yellow-600" />}
                                    </TimelineIcon>
                                    <TimelineTitle>
                                        {item.type === 'sale' ? `Vente - ${item.data.invoiceNumber}` : item.type === 'payment' ? 'Paiement Enregistré' : 'Retour de produit'}
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
                                                <p className={cn("text-xs font-semibold", 
                                                    item.data.paymentStatus === 'paid' && 'text-green-600', 
                                                    item.data.paymentStatus === 'partial' && 'text-yellow-600', 
                                                    item.data.paymentStatus === 'unpaid' && 'text-destructive'
                                                )}>
                                                    Statut: {item.data.paymentStatus === 'paid' ? 'Payé' : item.data.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => onViewSale(item.data)}>
                                                 <FileText className="mr-2 h-4 w-4" />
                                                Voir la facture
                                            </Button>
                                        </div>
                                    ) : item.type === 'payment' ? (
                                        <div className="p-3 rounded-md bg-green-500/10">
                                            <p className="font-semibold text-green-600">
                                                + {item.data.amount.toFixed(2)} DA
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-md bg-yellow-500/10">
                                            <p className="font-semibold text-yellow-600">
                                                - {item.data.totalReturnValue.toFixed(2)} DA
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Crédit sur facture {item.data.originalInvoiceNumber}
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

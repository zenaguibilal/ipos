'use client';
import { useState } from 'react';
import type { SaleWithDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InvoiceDetailsDialog } from './invoice-details-dialog';

export function SalesHistoryList({ sales }: { sales: SaleWithDetails[] }) {
    const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

    const formatPaymentMethod = (method: 'cash' | 'credit') => {
        switch (method) {
            case 'cash':
                return <Badge variant="secondary">نقدا</Badge>;
            case 'credit':
                return <Badge variant="outline">بالدين</Badge>;
            default:
                return <Badge variant="default">{method}</Badge>;
        }
    }
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Ventes</CardTitle>
                    <CardDescription>Consultez la liste de toutes les transactions récentes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Montant Total</TableHead>
                                <TableHead className="text-center">Paiement</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales.length === 0 && (
                                 <TableRow>
                                    <TableCell colSpan={4} className="text-center">Aucune vente trouvée.</TableCell>
                                </TableRow>
                            )}
                            {sales.map((sale) => (
                                <TableRow key={sale.id} onClick={() => setSelectedSale(sale)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="font-medium">{sale.customer?.name || 'Client inconnu'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(sale.saleDate), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(sale.totalAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
                                    </TableCell>
                                    <TableCell className="text-center">{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <InvoiceDetailsDialog sale={selectedSale} isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} />
        </>
    );
}

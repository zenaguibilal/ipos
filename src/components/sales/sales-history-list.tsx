'use client';
import { useState } from 'react';
import type { SaleWithDetails } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InvoiceDetailsDialog } from './invoice-details-dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SalesHistoryList({ sales }: { sales: SaleWithDetails[] }) {
    const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const formatPaymentMethod = (method: 'cash' | 'credit') => {
        switch (method) {
            case 'cash':
                return <Badge variant="secondary">نقدا</Badge>;
            case 'credit':
                return <Badge variant="outline">بالدين</Badge>;
            default:
                return <Badge variant="default">{method}</Badge>;
        }
    };

    const filteredSales = sales.filter(sale => {
        const invoiceNumber = String(sale.invoiceNumber).padStart(6, '0');
        const customerName = sale.customer?.name || '';
        const saleDate = format(new Date(sale.saleDate), "d MMMM yyyy 'à' HH:mm", { locale: fr });
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        return (
            invoiceNumber.includes(lowerCaseSearchTerm) ||
            customerName.toLowerCase().includes(lowerCaseSearchTerm) ||
            saleDate.toLowerCase().includes(lowerCaseSearchTerm)
        );
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Ventes</CardTitle>
                    <CardDescription>Consultez la liste de toutes les transactions récentes.</CardDescription>
                    <div className="relative pt-4">
                        <Search className="absolute left-2.5 top-6 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Rechercher par N°, client, ou date..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Facture N°</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Montant Total</TableHead>
                                <TableHead className="text-center">Paiement</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.length === 0 && (
                                 <TableRow>
                                    <TableCell colSpan={5} className="text-center">Aucune vente trouvée.</TableCell>
                                </TableRow>
                            )}
                            {filteredSales.map((sale) => (
                                <TableRow key={sale.id} onClick={() => setSelectedSale(sale)} className="cursor-pointer">
                                     <TableCell className="font-mono">
                                        {String(sale.invoiceNumber).padStart(6, '0')}
                                    </TableCell>
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

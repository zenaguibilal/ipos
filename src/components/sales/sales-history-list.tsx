'use client';
import { useState, useMemo } from "react";
import type { SaleWithDetails, Customer } from "@/lib/types";
import { useCustomers } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { History, Eye } from 'lucide-react';
import { Button } from "../ui/button";
import { InvoiceDetailsDialog } from "./invoice-details-dialog";


export function SalesHistoryList({ sales }: { sales: SaleWithDetails[] }) {
    const { customers } = useCustomers();
    const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

    const salesWithCustomerData = useMemo(() => {
        return sales.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId)
        }));
    }, [sales, customerMap]);

    return (
        <div className="space-y-6">
            <div className="grid gap-2">
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><History /> Historique des Ventes</h1>
                <p className="text-muted-foreground">Consultez la liste de toutes les transactions de vente.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Facture N°</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Paiement</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salesWithCustomerData.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-mono">#{String(sale.invoiceNumber).padStart(6, '0')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                             <AvatarImage src={sale.customer?.avatarUrl || ''} alt="Avatar" data-ai-hint={sale.customer?.avatarHint || 'person avatar'}/>
                                             <AvatarFallback>{sale.customer?.name?.charAt(0) || 'C'}</AvatarFallback>
                                        </Avatar>
                                        {sale.customer?.name || 'Client Général'}
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(sale.saleDate), "d MMM yyyy, HH:mm", { locale: fr })}</TableCell>
                                <TableCell>
                                    <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                                        {sale.paymentMethod === 'cash' ? 'Comptant' : 'Crédit'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {(sale.totalAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedSale(sale)}>
                                        <Eye className="mr-2 h-4 w-4" /> Voir
                                    </Button>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <InvoiceDetailsDialog 
                isOpen={!!selectedSale}
                onClose={() => setSelectedSale(null)}
                sale={selectedSale}
            />
        </div>
    );
}

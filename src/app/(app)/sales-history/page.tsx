'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, History, DollarSign, Receipt, Download, ChevronDown } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import type { Sale } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { toast } from 'sonner';


export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const sales = useLiveQuery(() => {
        if (!dateRange?.from) return [];
        return db.sales.where('createdAt').between(dateRange.from, dateRange.to || new Date(), true, true).reverse().toArray();
    }, [dateRange]);

    const { filteredSales, totalRevenue, salesCount } = useMemo(() => {
        if (!sales) return { filteredSales: [], totalRevenue: 0, salesCount: 0 };
        
        const filtered = debouncedSearchQuery ? sales.filter(s => 
            s.invoiceNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
            s.customerName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        ) : sales;

        const total = filtered.reduce((acc, s) => acc + s.total, 0);
        
        return { filteredSales: filtered, totalRevenue: total, salesCount: filtered.length };
    }, [sales, debouncedSearchQuery]);

    const handleExportSales = () => {
        if (!filteredSales || filteredSales.length === 0) {
            toast.info("Aucune vente à exporter.");
            return;
        }

        const dataToExport = filteredSales.flatMap(sale => 
            sale.items.map(item => ({
                'N° Facture': sale.invoiceNumber,
                'Date': format(safeToDate(sale.createdAt!), 'yyyy-MM-dd HH:mm', { locale: fr }),
                'Client': sale.customerName || 'Client de passage',
                'Statut Paiement': sale.paymentStatus,
                'Nom Produit': item.name,
                'Quantité': item.quantity,
                'Prix Unitaire': item.price,
                'Sous-total Article': item.price * item.quantity,
                'Total Facture': sale.total,
                'Montant Payé': sale.amountPaid,
                'Solde Restant': sale.remainingBalance,
            }))
        );
        
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `export_ventes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Historique des ventes exporté avec succès.");
    };

    const isLoading = sales === undefined;

    return (
        <>
            <SaleDetailsDialog isOpen={!!selectedSale} onOpenChange={() => setSelectedSale(null)} sale={selectedSale} />
            <CancelSaleDialog isOpen={!!saleToCancel} onOpenChange={() => setSaleToCancel(null)} sale={saleToCancel} />

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div><h1 className="text-2xl font-bold">Historique des Ventes</h1><p className="text-muted-foreground">Consultez, recherchez et gérez vos ventes passées.</p></div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {isClient ? (
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                        ) : (
                            <Skeleton className="h-10 w-[260px]" />
                        )}
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExportSales}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter en CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ventes (période)</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{salesCount}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chiffre d'affaires (période)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</div></CardContent></Card>
                </div>

                 <Card>
                    <CardHeader>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher par N° facture ou client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full" />
                        </div>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg"/>)}
                            </div>
                         ) : filteredSales.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <div className="text-center">
                                    <History className="mx-auto h-12 w-12 text-muted-foreground"/>
                                    <h3 className="mt-4 text-lg font-medium">Aucune vente trouvée</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{sales && sales.length > 0 ? "Aucune vente ne correspond à vos filtres." : "Commencez par enregistrer votre première vente."}</p>
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredSales.map((sale) => (
                                    <SalesHistoryCard key={sale.id} sale={sale} onViewDetails={setSelectedSale} onCancelSale={setSaleToCancel} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

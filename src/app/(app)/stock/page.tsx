'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Archive, FileText, Download, ChevronDown, CircleDollarSign, Hash } from 'lucide-react';
import type { StockIntake } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeCardSkeleton } from '@/components/stock/stock-intake-card-skeleton';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';


export default function StockPage() {
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isClient, setIsClient] = useState(false);
    
    const { data: searchQuery, mutate: setSearchQuery } = useSWR('stock_search_query', async () => (await dataService.getSetting('stock_search_query'))?.value || '', { revalidateOnFocus: false });
    const { data: dateRange, mutate: setDateRange } = useSWR('stock_date_range', async () => {
        const setting = await dataService.getSetting('stock_date_range');
        if (setting?.value) {
            return { from: new Date(setting.value.from), to: new Date(setting.value.to) };
        }
        const today = new Date();
        return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    }, { revalidateOnFocus: false });

    useEffect(() => { setIsClient(true) }, []);

    const handleSearchChange = (value: string) => { setSearchQuery(value, false); dataService.setSetting('stock_search_query', value); };
    const handleDateChange = (range?: DateRange) => { setDateRange(range, false); dataService.setSetting('stock_date_range', range); };

    const debouncedSearchQuery = useDebounce(searchQuery || '', 300);

    const stockIntakes = useLiveQuery(() => {
        const from = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
        const to = dateRange?.to ? endOfDay(dateRange.to) : new Date();
        return db.stockIntakes.where('createdAt').between(from, to, true, true).reverse().toArray();
    }, [dateRange]);

    const { filteredIntakes, totalIntakeValue, totalItemsReceived } = useMemo(() => {
        if (!stockIntakes) return { filteredIntakes: [], totalIntakeValue: 0, totalItemsReceived: 0 };
        
        const filtered = debouncedSearchQuery ? stockIntakes.filter(intake => 
            intake.invoiceNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
            intake.supplier.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        ) : stockIntakes;

        const totalValue = filtered.reduce((acc, intake) => acc + intake.totalValue, 0);
        const totalItems = filtered.reduce((acc, intake) => acc + intake.items.reduce((itemAcc, item) => itemAcc + item.quantityReceived, 0), 0);
        
        return { filteredIntakes: filtered, totalIntakeValue: totalValue, totalItemsReceived: totalItems };
    }, [stockIntakes, debouncedSearchQuery]);
    
    const handleExport = () => {
        if (filteredIntakes.length === 0) { toast.info("Aucune donnée à exporter."); return; }
        const dataToExport = filteredIntakes.flatMap(intake => 
            intake.items.map(item => ({
                'Date Réception': intake.createdAt ? format(safeToDate(intake.createdAt), 'yyyy-MM-dd') : 'N/A',
                'Fournisseur': intake.supplier, 'N° Facture': intake.invoiceNumber,
                'Nom Produit': item.productName, 'Quantité Reçue': item.quantityReceived,
                'Prix Achat Unitaire': item.purchasePrice, 'Sous-total': item.quantityReceived * item.purchasePrice,
            }))
        );

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'historique_receptions.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Historique des réceptions exporté avec succès.");
    };

    const isLoading = stockIntakes === undefined || searchQuery === undefined || dateRange === undefined;

    return (
        <>
            <StockIntakeDetailsDialog isOpen={!!selectedIntake} onOpenChange={() => setSelectedIntake(null)} intake={selectedIntake} />
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div><h1 className="text-2xl font-bold">Réception de Stock</h1><p className="text-muted-foreground">Consultez l'historique des réceptions de marchandises.</p></div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {isClient && !isLoading ? (
                            <DateRangePicker date={dateRange} setDate={handleDateChange} />
                        ) : (
                            <Skeleton className="h-10 w-[260px]" />
                        )}
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline">Actions <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end"><DropdownMenuItem onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exporter en CSV</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                        <Button asChild><Link href="/stock/intake"><PlusCircle className="mr-2 h-4 w-4" />Nouvelle réception</Link></Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Réceptions (filtrées)</CardTitle><Archive className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{filteredIntakes.length}</div><p className="text-xs text-muted-foreground">Transactions de réception sur la période</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valeur Reçue (filtrée)</CardTitle><CircleDollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalIntakeValue.toFixed(1)} DA</div><p className="text-xs text-muted-foreground">Valeur d'achat des marchandises</p></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Articles Reçus (filtrés)</CardTitle><Hash className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalItemsReceived}</div><p className="text-xs text-muted-foreground">Nombre d'articles reçus</p></CardContent></Card>
                </div>

                 <Card>
                    <CardHeader>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher par N° facture ou fournisseur..." value={searchQuery || ''} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 w-full" />
                        </div>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <StockIntakeCardSkeleton key={i} />)}
                            </div>
                         ) : filteredIntakes.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <div className="text-center">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground"/>
                                    <h3 className="mt-4 text-lg font-medium">Aucune réception trouvée</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{stockIntakes && stockIntakes.length > 0 ? "Aucune réception ne correspond à vos filtres." : "Commencez par enregistrer votre première réception."}</p>
                                     {(!stockIntakes || stockIntakes.length === 0) && (
                                        <Button asChild className="mt-4"><Link href="/stock/intake">Enregistrer une réception</Link></Button>
                                     )}
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredIntakes.map((intake) => (
                                    <StockIntakeCard key={intake.id} intake={intake} onViewDetails={setSelectedIntake} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Undo2, DollarSign, Hash } from 'lucide-react';
import type { ProductReturn } from '@/lib/types';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';


export default function ReturnsHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [returnToCancel, setReturnToCancel] = useState<ProductReturn | null>(null);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true) }, []);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const returns = useLiveQuery(() => {
        if (!dateRange?.from) return [];
        return db.returns.where('createdAt').between(dateRange.from, dateRange.to || new Date(), true, true).reverse().toArray();
    }, [dateRange]);

    const { filteredReturns, totalReturnedValue, returnsCount } = useMemo(() => {
        if (!returns) return { filteredReturns: [], totalReturnedValue: 0, returnsCount: 0 };
        
        const filtered = debouncedSearchQuery ? returns.filter(r => 
            r.originalInvoiceNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
            r.customerName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        ) : returns;

        const totalValue = filtered.reduce((acc, r) => acc + r.totalReturnValue, 0);
        
        return { filteredReturns: filtered, totalReturnedValue: totalValue, returnsCount: filtered.length };
    }, [returns, debouncedSearchQuery]);

    const isLoading = returns === undefined;

    return (
        <>
            <ReturnDetailsDialog isOpen={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)} productReturn={selectedReturn} />
            <CancelReturnDialog isOpen={!!returnToCancel} onOpenChange={() => setReturnToCancel(null)} productReturn={returnToCancel} />

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div><h1 className="text-2xl font-bold">Historique des Retours</h1><p className="text-muted-foreground">Consultez et gérez les retours de produits.</p></div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {isClient ? (
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                        ) : (
                            <Skeleton className="h-10 w-[260px]" />
                        )}
                        <Button asChild><Link href="/returns/new"><PlusCircle className="mr-2 h-4 w-4" /> Nouveau retour</Link></Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Retours (période)</CardTitle><Hash className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{returnsCount}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valeur Retournée (période)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(totalReturnedValue)}</div></CardContent></Card>
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
                                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg"/>)}
                            </div>
                         ) : filteredReturns.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <div className="text-center">
                                    <Undo2 className="mx-auto h-12 w-12 text-muted-foreground"/>
                                    <h3 className="mt-4 text-lg font-medium">Aucun retour trouvé</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{returns && returns.length > 0 ? "Aucun retour ne correspond à vos filtres." : "Commencez par enregistrer votre premier retour."}</p>
                                    {(!returns || returns.length === 0) && (
                                        <Button asChild className="mt-4"><Link href="/returns/new">Enregistrer un retour</Link></Button>
                                     )}
                                </div>
                            </div>
                        ) : (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredReturns.map((pr) => (
                                    <ReturnHistoryCard key={pr.id} productReturn={pr} onViewDetails={setSelectedReturn} onCancelReturn={setReturnToCancel} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

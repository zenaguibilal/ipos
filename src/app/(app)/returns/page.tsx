'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { ReturnHistoryCard } from '@/components/returns/ReturnHistoryCard';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import { CancelReturnDialog } from '@/components/returns/CancelReturnDialog';
import { Input } from '@/components/ui/input';
import { Search, Undo2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductReturn } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReturnsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 300);

    const returns = useLiveQuery(() => {
        const lowerQuery = debouncedSearch.toLowerCase();
        if (lowerQuery) {
            return db.returns.filter(r =>
                r.originalInvoiceNumber.toLowerCase().includes(lowerQuery) ||
                (r.customerName && r.customerName.toLowerCase().includes(lowerQuery))
            ).reverse().sortBy('createdAt');
        }
        return db.returns.reverse().sortBy('createdAt');
    }, [debouncedSearch]);

    const handleViewDetails = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsDetailsOpen(true);
    };

    const handleCancelReturn = (pr: ProductReturn) => {
        setSelectedReturn(pr);
        setIsCancelOpen(true);
    };
    
    const isLoading = returns === undefined;

    return (
        <>
            <div className="p-4 sm:p-6 h-full flex flex-col">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Gestion des Retours</h1>
                    <p className="text-muted-foreground">Consultez ou annulez les retours de produits.</p>
                </header>

                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="relative flex-grow min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par N° de facture ou nom..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto -mx-4 px-4 pb-4">
                     {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-60" />)}
                        </div>
                    ) : returns && returns.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {returns.map(r => (
                                <ReturnHistoryCard
                                    key={r.id}
                                    productReturn={r}
                                    onViewDetails={handleViewDetails}
                                    onCancelReturn={handleCancelReturn}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Undo2 className="h-12 w-12 mb-4" />
                            <p className="text-lg font-semibold">Aucun retour trouvé</p>
                            <p>Les retours que vous enregistrez apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </div>

            <ReturnDetailsDialog isOpen={isDetailsOpen} onOpenChange={setIsDetailsOpen} productReturn={selectedReturn} />
            <CancelReturnDialog isOpen={isCancelOpen} onOpenChange={setIsCancelOpen} productReturn={selectedReturn} />
        </>
    );
}

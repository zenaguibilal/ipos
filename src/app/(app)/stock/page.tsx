
'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeCardSkeleton } from '@/components/stock/stock-intake-card-skeleton';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import Link from 'next/link';

export default function StockPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDateRange, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const stockIntakes = useLiveQuery(
        () => dataService.getStockIntakes({ 
            query: debouncedSearchQuery,
            from: dateRange?.from,
            to: dateRange?.to
        }),
        [debouncedSearchQuery, dateRange],
        []
    );

    const isLoading = stockIntakes === undefined || !isMounted;

    const handleViewDetails = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    };

    const renderSkeletons = () => (
        [...Array(6)].map((_, i) => <StockIntakeCardSkeleton key={i} />)
    );

    const renderContent = () => {
        if (isLoading) {
            return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{renderSkeletons()}</div>;
        }

        if (stockIntakes.length === 0) {
            return (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucune réception de stock trouvée</h3>
                    <p className="text-muted-foreground mt-2">Commencez par enregistrer une nouvelle réception de stock.</p>
                     <Button className="mt-4" asChild>
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                    </Button>
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stockIntakes.map(s => (
                    <StockIntakeCard 
                        key={s.id} 
                        intake={s}
                        onViewDetails={handleViewDetails}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Historique des Réceptions de Stock</h1>
                    <p className="text-muted-foreground">Recherchez et consultez toutes les réceptions de marchandises.</p>
                </div>
                 <Button className="w-full sm:w-auto" asChild>
                    <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                </Button>
            </header>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par Fournisseur ou N° Facture..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>
            
            <div>{renderContent()}</div>

            <StockIntakeDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                intake={selectedIntake}
            />
        </div>
    );
}

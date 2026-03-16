

'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { StockIntake } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Archive } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { StockIntakeCard } from '@/components/stock/stock-intake-card';
import { StockIntakeDetailsDialog } from '@/components/stock/stock-intake-details-dialog';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export default function StockPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const stockIntakes = useLiveQuery(
        () => dataService.getStockIntakes({ 
            query: debouncedSearchQuery,
            from: dateRange?.from,
            to: dateRange?.to
        }),
        [debouncedSearchQuery, dateRange]
    );

    const isLoading = stockIntakes === undefined || !isMounted;

    const handleViewDetails = (intake: StockIntake) => {
        setSelectedIntake(intake);
        setIsDetailsOpen(true);
    };

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (!stockIntakes || stockIntakes.length === 0) {
            return (
                <EmptyState
                    icon={Archive}
                    title="Aucune réception de stock trouvée"
                    description="Commencez par enregistrer une nouvelle réception de stock."
                >
                     <Button asChild>
                        <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                    </Button>
                </EmptyState>
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
            <PageHeader
                title="Historique des Réceptions de Stock"
                description="Recherchez et consultez toutes les réceptions de marchandises."
            >
                 <Button asChild>
                    <Link href="/stock/intake"><Plus className="mr-2 h-4 w-4" /> Nouvelle Réception</Link>
                </Button>
            </PageHeader>

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
                <DateRangePicker date={dateRange} setDate={setDate} />
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

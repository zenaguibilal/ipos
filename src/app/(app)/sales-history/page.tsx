'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { salesService } from '@/services/sales.service';
import { customerService } from '@/services/customer.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Sale, Customer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, History, FileUp, Filter, TrendingUp, Receipt, ShoppingBag } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { SalesHistoryCard } from '@/components/sales/SalesHistoryCard';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { CancelSaleDialog } from '@/components/sales/CancelSaleDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PaymentFilter = 'all' | 'paid' | 'partial' | 'unpaid';

export default function SalesHistoryPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

    const [sales, setSales] = useState<Sale[] | undefined>(undefined);
    const [customerMap, setCustomerMap] = useState<Map<string, Customer>>(new Map());
    const [isExporting, setIsExporting] = useState(false);
    const isLoading = sales === undefined;

    const fetchSalesAndCustomers = useCallback(async () => {
        if (!isMounted || !dateRange) return;
        setSales(undefined);
        try {
            const [salesData, customersData] = await Promise.all([
                salesService.filterSales({
                    query: debouncedSearchQuery,
                    from: dateRange.from,
                    to: dateRange.to
                }),
                customerService.getCustomers()
            ]);
            setSales(salesData);
            setCustomerMap(new Map(customersData.map(c => [c.uuid, c])));
        } catch (error: any) {
            toast.error("Impossible de charger l'historique des ventes ou les clients.", { description: error.message });
            setSales([]);
        }
    }, [isMounted, debouncedSearchQuery, dateRange]);

    useEffect(() => {
        fetchSalesAndCustomers();
    }, [fetchSalesAndCustomers]);

    const filteredSales = useMemo(() => {
        if (!sales) return [];
        if (paymentFilter === 'all') return sales;
        return sales.filter(s => s.paymentStatus === paymentFilter);
    }, [sales, paymentFilter]);

    const stats = useMemo(() => {
        const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
        const count = filteredSales.length;
        const avgBasket = count > 0 ? totalRevenue / count : 0;
        return { totalRevenue, count, avgBasket };
    }, [filteredSales]);

    const handleViewDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailsOpen(true);
    };

    const handleCancelSale = (sale: Sale) => {
        setSelectedSale(sale);
        setIsCancelOpen(true);
    };

    const handleExport = async () => {
        if (!filteredSales.length) {
            toast.info("Aucune vente à exporter.");
            return;
        }
        setIsExporting(true);
        try {
            await salesService.exportToCSV(filteredSales, customerMap);
            toast.success("Historique exporté avec succès.");
        } catch (error: any) {
            toast.error("Erreur lors de l'exportation.");
        } finally {
            setIsExporting(false);
        }
    };
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (filteredSales.length === 0) {
            return (
                <EmptyState
                    icon={History}
                    title="Aucune vente trouvée"
                    description="Essayez d'ajuster votre recherche ou vos filtres de période."
                />
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSales.map(s => {
                    const customer = s.customerUuid ? customerMap.get(s.customerUuid) : undefined;
                    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
                    return (
                        <SalesHistoryCard 
                            key={s.uuid} 
                            sale={s}
                            customerName={customerName}
                            onViewDetails={handleViewDetails}
                            onCancelSale={handleCancelSale}
                        />
                    )
                })}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Historique des Ventes"
                description="Consultez et gérez vos transactions passées."
            >
                <Button variant="outline" onClick={handleExport} disabled={isLoading || isExporting}>
                    <FileUp className={cn("mr-2 h-4 w-4", isExporting && "animate-pulse")} />
                    Exporter
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Recettes Totales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-primary">{formatCurrency(stats.totalRevenue)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            Nombre de Ventes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black">{stats.count}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            Panier Moyen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black">{formatCurrency(stats.avgBasket)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par N° Facture ou Nom Client..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Filter className="mr-2 h-4 w-4" />
                            Statut: {paymentFilter === 'all' ? 'Tous' : paymentFilter === 'paid' ? 'Payé' : paymentFilter === 'partial' ? 'Partiel' : 'Impayé'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrer par paiement</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={paymentFilter === 'all'} onCheckedChange={() => setPaymentFilter('all')}>Tout afficher</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={paymentFilter === 'paid'} onCheckedChange={() => setPaymentFilter('paid')}>Payées uniquement</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={paymentFilter === 'partial'} onCheckedChange={() => setPaymentFilter('partial')}>Partielles uniquement</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={paymentFilter === 'unpaid'} onCheckedChange={() => setPaymentFilter('unpaid')}>Impayées uniquement</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DateRangePicker date={dateRange} setDate={setDate} />
            </div>
            
            <div className="min-h-[400px]">
               {renderContent()}
            </div>

            <SaleDetailsDialog 
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                sale={selectedSale}
                customerName={selectedSale?.customerUuid ? (customerMap.get(selectedSale.customerUuid) ? `${customerMap.get(selectedSale.customerUuid)?.firstName} ${customerMap.get(selectedSale.customerUuid)?.lastName}` : 'Client Inconnu') : 'Client de passage'}
            />
            <CancelSaleDialog 
                isOpen={isCancelOpen}
                onOpenChange={setIsCancelOpen}
                sale={selectedSale}
                onSuccess={fetchSalesAndCustomers}
            />
        </div>
    );
}

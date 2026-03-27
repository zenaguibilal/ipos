
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List, Printer, Trash2, PackageCheck, PackageX, AlertTriangle, Archive, SortAsc, FileDown, Building, Package, Loader2, CalendarClock, CalendarX, FileUp, Scan, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DeleteMultipleProductsDialog } from '@/components/products/DeleteMultipleProductsDialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { InventoryStats } from '@/components/products/InventoryStats';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import { ProductHistoryDialog } from '@/components/products/ProductHistoryDialog';
import { BarcodeScannerDialog } from '@/components/products/BarcodeScannerDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { CsvImporter } from '@/lib/csv-utils';

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';

const stockStatusOptions: { value: StockStatus, label: string, icon: React.ElementType }[] = [
    { value: 'all', label: 'Tous les statuts', icon: Archive },
    { value: 'in_stock', label: 'En Stock', icon: PackageCheck },
    { value: 'low_stock', label: 'Stock Faible', icon: AlertTriangle },
    { value: 'out_of_stock', label: 'En Rupture', icon: PackageX },
    { value: 'expiring_soon', label: 'Expire Bientôt', icon: CalendarClock },
    { value: 'expired', label: 'Expiré', icon: CalendarX },
];

const sortOptions: { [key: string]: string } = {
    'name_asc': 'Nom (A-Z)',
    'name_desc': 'Nom (Z-A)',
    'price_desc': 'Prix (décroissant)',
    'price_asc': 'Prix (croissant)',
    'quantity_desc': 'Stock (décroissant)',
    'quantity_asc': 'Stock (croissant)',
    'createdAt_desc': 'Plus récents',
    'createdAt_asc': 'Plus anciens',
    'dateExpiration_asc': 'Date d\'expiration (proche)',
    'dateExpiration_desc': 'Date d\'expiration (lointaine)',
};

export default function ProductsPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const searchParams = useSearchParams();
    const { viewMode, setViewMode } = useAppStore(state => ({
        viewMode: state.productViewMode,
        setViewMode: state.actions.setProductViewMode,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [stockStatus, setStockStatus] = useState<StockStatus>('all');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [products, setProducts] = useState<Product[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isLoading = products === undefined || categories === undefined || suppliers === undefined;
    
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const fetchProducts = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const query = new URLSearchParams({ 
                query: debouncedSearchQuery, 
                category: selectedCategory, 
                supplierUuid: selectedSupplier,
                stockStatus, 
                sortBy 
            }).toString();
            const data = await api.get<Product[]>(`products?${query}`);
            setProducts(data);
        } catch(error: any) {
            toast.error("Impossible de charger les produits.");
            setProducts([]);
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [debouncedSearchQuery, selectedCategory, selectedSupplier, stockStatus, sortBy]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const fetchMeta = useCallback(async () => {
        try {
            const [cats, sups] = await Promise.all([
                api.get<string[]>('products/categories'),
                api.get<Supplier[]>('suppliers')
            ]);
            setCategories(cats);
            setSuppliers(sups);
        } catch(error: any) {
            setCategories([]);
            setSuppliers([]);
        }
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        try {
            const analysis = await CsvImporter.analyzeProducts(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de l'analyse.");
        } finally {
            setIsAnalyzing(false);
            e.target.value = '';
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await api.post('products/bulk-import', confirmedData);
            toast.success("Importation terminée !");
            setIsImportPreviewOpen(false);
            fetchProducts(true);
        } catch (error: any) {
            toast.error("Erreur d'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCSV = () => {
        if (!products || products.length === 0) return;
        CsvImporter.exportProducts(products);
    };

    const handleScanSuccess = (barcode: string) => {
        setSearchQuery(barcode);
        toast.success(`Scanné: ${barcode}`);
    };

    const currentStockStatusOption = stockStatusOptions.find(o => o.value === stockStatus)!;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Inventaire Cloud" description="Gestion souveraine du stock et des actifs.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV} disabled={isLoading} className="luxury-glass border-white/10">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button asChild variant="outline" className="luxury-glass border-white/10">
                                <label className="cursor-pointer">
                                    <FileDown className="mr-2 h-4 w-4" /> Importer
                                    <input type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
                                </label>
                            </Button>
                            <Button onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Ajouter
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <InventoryStats products={products} isLoading={isLoading} />

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Nom ou code-barres..."
                            className="pl-10 h-11 luxury-glass rounded-xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 luxury-glass" onClick={() => setIsScannerOpen(true)}>
                        <Scan className="h-4 w-4" />
                    </Button>
                </div>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 luxury-glass rounded-xl">Catégories</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="luxury-glass">
                        <DropdownMenuCheckboxItem checked={selectedCategory === 'all'} onCheckedChange={() => setSelectedCategory('all')}>Toutes</DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        {categories?.map(cat => (
                            <DropdownMenuCheckboxItem key={cat} checked={selectedCategory === cat} onCheckedChange={() => setSelectedCategory(cat)}>{cat}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 luxury-glass rounded-xl">Trier: {sortOptions[sortBy]}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="luxury-glass">
                        <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                            {Object.entries(sortOptions).map(([k, v]) => <DropdownMenuRadioItem key={k} value={k}>{v}</DropdownMenuRadioItem>)}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-5 w-5"/></Button>
                </div>

                <Button variant="ghost" size="icon" className="h-11 w-11 luxury-glass" onClick={() => fetchProducts(true)} disabled={isRefreshing}>
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
            </div>

            <div className="min-h-[400px]">
               {isLoading ? (viewMode === 'grid' ? <div className="grid grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div> : <ProductTableSkeleton />) : (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           {products.map(p => <ProductCard key={p.uuid} product={p} onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} onDuplicate={(p) => { const { uuid, ...rest } = p; setSelectedProduct(rest); setIsProductDialogOpen(true); }} onViewHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} isSelected={selectedProducts.has(p.uuid)} onToggleSelection={() => { const s = new Set(selectedProducts); s.has(p.uuid) ? s.delete(p.uuid) : s.add(p.uuid); setSelectedProducts(s); }} />)}
                       </div>
                   ) : (
                       <ProductTable products={products} onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} onDuplicate={(p) => { const { uuid, ...rest } = p; setSelectedProduct(rest); setIsProductDialogOpen(true); }} onViewHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} selectedProducts={selectedProducts} onToggleProductSelection={(id) => { const s = new Set(selectedProducts); s.has(id) ? s.delete(id) : s.add(id); setSelectedProducts(s); }} onToggleSelectAll={() => setSelectedProducts(selectedProducts.size === products.length ? new Set() : new Set(products.map(p => p.uuid)))} suppliers={suppliers || []} />
                   )
               )}
            </div>

            {/* DIALOGS */}
            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} categories={categories || []} suppliers={suppliers || []} onSuccess={() => fetchProducts(true)} />
            <ProductHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} product={selectedProduct as Product} />
            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleScanSuccess} />
            <ProductImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
        </div>
    );
}

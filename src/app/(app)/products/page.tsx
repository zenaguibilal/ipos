'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List, Printer, Trash2, PackageCheck, PackageX, AlertTriangle, Archive, SortAsc, FileDown, Building, Package, Loader2, CalendarClock, CalendarX, FileUp, Scan } from 'lucide-react';
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
import { productService } from '@/services/product.service';
import { supplierService } from '@/services/supplier.service';
import { useAppStore, useIsManagerOrAdmin } from '@/stores/appStore';

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
    const searchInputRef = useRef<HTMLInputElement>(null);
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

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [products, setProducts] = useState<Product[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);
    const isLoading = products === undefined || categories === undefined || suppliers === undefined;
    
    // States for CSV Import
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const stockStatusFromQuery = searchParams.get('stockStatus') as StockStatus;
        if (stockStatusFromQuery && ['all', 'in_stock', 'low_stock', 'out_of_stock', 'expiring_soon', 'expired'].includes(stockStatusFromQuery)) {
            setStockStatus(stockStatusFromQuery);
        }
        const queryFromUrl = searchParams.get('query');
        if (queryFromUrl) {
            setSearchQuery(queryFromUrl);
        }
        
        // Auto focus search bar
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchParams]);

    const fetchProducts = useCallback(async () => {
        setProducts(undefined);
        try {
            const data = await productService.filterProducts({ 
                query: debouncedSearchQuery, 
                category: selectedCategory, 
                supplierUuid: selectedSupplier,
                stockStatus, 
                sortBy 
            });
            setProducts(data);
        } catch(error: any) {
            toast.error("Impossible de charger les produits.", { description: error.message });
            setProducts([]);
        }
    }, [debouncedSearchQuery, selectedCategory, selectedSupplier, stockStatus, sortBy]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const fetchMeta = useCallback(async () => {
        try {
            const [cats, sups] = await Promise.all([
                productService.getCategories(),
                supplierService.getSuppliers()
            ]);
            setCategories(cats);
            setSuppliers(sups);
        } catch(error: any) {
            toast.error("Impossible de charger les métadonnées.", { description: error.message });
            setCategories([]);
            setSuppliers([]);
        }
    }, []);

    useEffect(() => {
        fetchMeta();
    }, [fetchMeta]);
    
    useEffect(() => {
        setSelectedProducts(new Set());
    }, [products]);

    const onDialogSuccess = () => {
        fetchProducts();
        fetchMeta(); // Re-fetch categories/suppliers in case they were changed
    }

    const handleEditProduct = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    }, []);

    const handleDuplicateProduct = useCallback((product: Product) => {
        // Create a copy without unique identifiers
        const { uuid, barcodes, ...rest } = product;
        setSelectedProduct({ ...rest, barcodes: [] } as Product);
        setIsProductDialogOpen(true);
    }, []);

    const handleViewHistory = useCallback((product: Product) => {
        setSelectedProduct(product);
        setIsHistoryDialogOpen(true);
    }, []);

    const handleDeleteProduct = useCallback(async (product: Product) => {
        try {
            await productService.deleteProduct(product.uuid);
            toast.success(`Produit "${product.name}" supprimé.`);
            fetchProducts();
        } catch (error: any) {
            toast.error("Échec de la suppression.", { description: error.message });
        }
    }, [fetchProducts]);

    const handleToggleSelection = useCallback((productUuid: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productUuid)) {
                newSet.delete(productUuid);
            } else {
                newSet.add(productUuid);
            }
            return newSet;
        });
    }, []);
    
    const handleToggleSelectAll = useCallback(() => {
        if (!products) return;
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.uuid)));
        }
    }, [products, selectedProducts.size]);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            const analysis = await productService.analyzeImport(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de l'analyse du fichier.", { description: error.message });
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await productService.executeImport(confirmedData);
            toast.success("Importation des produits terminée !");
            setIsImportPreviewOpen(false);
            setImportAnalysis(null);
            onDialogSuccess(); // Refresh products and meta
        } catch (error: any) {
            toast.error("Erreur lors de l'importation des produits.", { description: error.message });
        } finally {
            setIsImporting(false);
        }
    };

    const handleExportCSV = async () => {
        if (!products || products.length === 0) {
            toast.info("Aucun produit à exporter.");
            return;
        }
        try {
            await productService.exportToCSV(products);
            toast.success("Inventaire exporté avec succès.");
        } catch (error: any) {
            toast.error("Erreur lors de l'exportation.", { description: error.message });
        }
    };

    const handleScanSuccess = (barcode: string) => {
        setSearchQuery(barcode);
        toast.success(`Code scanné : ${barcode}`);
    };
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="p-0"><Skeleton className="rounded-t-lg aspect-[4/3]" /></CardHeader>
                    <CardContent className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent>
                    <CardFooter className="p-4 pt-0"><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return viewMode === 'grid' ? renderSkeletons() : <ProductTableSkeleton />;
        }

        if (!products || products.length === 0) {
            return (
                <EmptyState
                    icon={Package}
                    title="Aucun produit trouvé"
                    description="Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouveau produit."
                >
                     <Button onClick={() => setIsProductDialogOpen(true)} disabled={!isManagerOrAdmin}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
                    </Button>
                </EmptyState>
            );
        }
        
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(p => (
                        <ProductCard 
                            key={p.uuid} 
                            product={p} 
                            onEdit={handleEditProduct} 
                            onDuplicate={handleDuplicateProduct}
                            onViewHistory={handleViewHistory}
                            onDelete={() => {
                                setSelectedProduct(p);
                                setIsDeleteDialogOpen(true);
                            }}
                            isSelected={selectedProducts.has(p.uuid)}
                            onToggleSelection={() => handleToggleSelection(p.uuid)}
                        />
                    ))}
                </div>
            );
        }

        return (
            <ProductTable 
                products={products}
                onEdit={handleEditProduct}
                onDuplicate={handleDuplicateProduct}
                onViewHistory={handleViewHistory}
                onDelete={(p) => {
                    setSelectedProduct(p);
                    setIsDeleteDialogOpen(true);
                }}
                selectedProducts={selectedProducts}
                onToggleProductSelection={handleToggleSelection}
                onToggleSelectAll={handleToggleSelectAll}
                suppliers={suppliers || []}
            />
        );
    }

    const currentStockStatusOption = stockStatusOptions.find(o => o.value === stockStatus)!;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Gestion des Produits"
                description="Recherchez, filtrez et gérez votre inventaire."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExportCSV} disabled={isLoading || !products || products.length === 0}>
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button asChild variant="outline" disabled={isAnalyzing}>
                                <label htmlFor="csv-product-importer">
                                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                    {isAnalyzing ? 'Analyse...' : 'Importer'}
                                    <input type="file" id="csv-product-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
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
                            ref={searchInputRef}
                            placeholder="Nom ou code-barres..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsScannerOpen(true)}>
                        <Scan className="h-4 w-4" />
                    </Button>
                </div>
                
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">Filtrer par catégorie</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Catégories</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={selectedCategory === 'all'}
                            onCheckedChange={() => setSelectedCategory('all')}
                        >Toutes</DropdownMenuCheckboxItem>
                         {categories && categories.map(cat => (
                             <DropdownMenuCheckboxItem
                                key={cat}
                                checked={selectedCategory === cat}
                                onCheckedChange={() => setSelectedCategory(cat)}
                            >{cat}</DropdownMenuCheckboxItem>
                         ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Building className="mr-2 h-4 w-4" />
                            Filtrer par Fournisseur
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Fournisseurs</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={selectedSupplier === 'all'}
                            onCheckedChange={() => setSelectedSupplier('all')}
                        >Tous</DropdownMenuCheckboxItem>
                        {suppliers?.map(sup => (
                            <DropdownMenuCheckboxItem
                                key={sup.uuid}
                                checked={selectedSupplier === sup.uuid}
                                onCheckedChange={() => setSelectedSupplier(sup.uuid)}
                            >{sup.name}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <currentStockStatusOption.icon className="mr-2 h-4 w-4" />
                            {currentStockStatusOption.label}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Statut du Stock</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {stockStatusOptions.map(option => (
                             <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={stockStatus === option.value}
                                onCheckedChange={() => setStockStatus(option.value)}
                            >
                                <option.icon className="mr-2 h-4 w-4" />
                                {option.label}
                            </DropdownMenuCheckboxItem>
                         ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <SortAsc className="mr-2 h-4 w-4" />
                            Trier par: {sortOptions[sortBy]}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Trier les produits par</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                            {Object.entries(sortOptions).map(([key, value]) => (
                                <DropdownMenuRadioItem key={key} value={key}>{value}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>


                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-5 w-5"/>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
            </div>

            {isManagerOrAdmin && (
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-center bg-card border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="select-all"
                            checked={!isLoading && products && products.length > 0 && selectedProducts.size === products.length}
                            onCheckedChange={handleToggleSelectAll}
                            disabled={isLoading || !products || products.length === 0}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                            {selectedProducts.size > 0 ? `${selectedProducts.size} sélectionné(s)` : "Tout sélectionner"}
                        </label>
                    </div>
                    {selectedProducts.size > 0 && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsPrintDialogOpen(true)}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimer
                            </Button>
                            <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </Button>
                        </div>
                    )}
                </div>
            )}
            
            <div>
               {renderContent()}
            </div>

            {isManagerOrAdmin && (
                <>
                    <ProductDialog 
                        isOpen={isProductDialogOpen}
                        onOpenChange={setIsProductDialogOpen}
                        product={selectedProduct}
                        categories={categories || []}
                        suppliers={suppliers || []}
                        onSuccess={onDialogSuccess}
                    />
                    <DeleteProductDialog 
                        isOpen={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        product={selectedProduct}
                        onConfirmDelete={handleDeleteProduct}
                    />
                    <PrintLabelsDialog
                        isOpen={isPrintDialogOpen}
                        onOpenChange={setIsPrintDialogOpen}
                        productUuids={Array.from(selectedProducts)}
                    />
                     <DeleteMultipleProductsDialog
                        isOpen={isBulkDeleteDialogOpen}
                        onOpenChange={setIsBulkDeleteDialogOpen}
                        productUuids={Array.from(selectedProducts)}
                        onSuccess={() => {
                            setSelectedProducts(new Set());
                            fetchProducts();
                        }}
                    />
                     <ProductImportPreviewDialog
                        isOpen={isImportPreviewOpen}
                        onOpenChange={setIsImportPreviewOpen}
                        analysis={importAnalysis}
                        onConfirm={handleConfirmImport}
                        isImporting={isImporting}
                    />
                    <ProductHistoryDialog
                        isOpen={isHistoryDialogOpen}
                        onOpenChange={setIsHistoryDialogOpen}
                        product={selectedProduct}
                    />
                    <BarcodeScannerDialog
                        isOpen={isScannerOpen}
                        onOpenChange={setIsScannerOpen}
                        onScanSuccess={handleScanSuccess}
                    />
                </>
            )}
        </div>
    );
}
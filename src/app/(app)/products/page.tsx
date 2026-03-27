'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List, FileDown, Scan, RefreshCw, FileUp } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { InventoryStats } from '@/components/products/InventoryStats';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import { ProductHistoryDialog } from '@/components/products/ProductHistoryDialog';
import { BarcodeScannerDialog } from '@/components/products/BarcodeScannerDialog';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api-client';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { CsvImporter } from '@/lib/csv-utils';

/**
 * @fileOverview Products Page (Architecture Purified)
 * تم القضاء على الحالات المحلية (ViewMode) لفرض سيادة الـ Store.
 */

export default function ProductsPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { products, isLoading, viewMode } = useAppStore(state => ({
        products: state.products,
        isLoading: state.isLoading.products,
        viewMode: state.productViewMode
    }));
    const { refreshProducts, setProductViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [categories, setCategories] = useState<string[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        refreshProducts(debouncedSearchQuery);
    }, [debouncedSearchQuery, refreshProducts]);

    useEffect(() => {
        api.get<string[]>('products/categories').then(setCategories);
        api.get<Supplier[]>('suppliers').then(setSuppliers);
    }, []);

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
            refreshProducts();
        } catch (error: any) {
            toast.error("Erreur d'importation.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Inventaire Cloud" description="Gestion souveraine du stock et des actifs.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => CsvImporter.exportProducts(products)} className="luxury-glass border-white/10">
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
                            placeholder="Rechercher..."
                            className="pl-10 h-11 luxury-glass rounded-xl"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-11 w-11 luxury-glass" onClick={() => setIsScannerOpen(true)}>
                        <Scan className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass">
                    <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" onClick={() => setProductViewMode('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" onClick={() => setProductViewMode('list')}><List className="h-5 w-5"/></Button>
                </div>

                <Button variant="ghost" size="icon" className="h-11 w-11 luxury-glass" onClick={() => refreshProducts()} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </div>

            <div className="min-h-[400px]">
               {isLoading && products.length === 0 ? <ProductTableSkeleton /> : (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           {products.map(p => <ProductCard key={p.uuid} product={p} onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} onDuplicate={(p) => { const { uuid, ...rest } = p; setSelectedProduct(rest); setIsProductDialogOpen(true); }} onViewHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} isSelected={selectedProducts.has(p.uuid)} onToggleSelection={() => {}} />)}
                       </div>
                   ) : (
                       <ProductTable products={products} onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} onDuplicate={(p) => { const { uuid, ...rest } = p; setSelectedProduct(rest); setIsProductDialogOpen(true); }} onViewHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} selectedProducts={selectedProducts} onToggleProductSelection={() => {}} onToggleSelectAll={() => {}} suppliers={suppliers} />
                   )
               )}
            </div>

            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} categories={categories} suppliers={suppliers} onSuccess={() => refreshProducts()} />
            <DeleteProductDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} product={selectedProduct as Product} onSuccess={() => refreshProducts()} />
            <ProductHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} product={selectedProduct as Product} />
            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={(b) => setSearchQuery(b)} />
            <ProductImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
        </div>
    );
}
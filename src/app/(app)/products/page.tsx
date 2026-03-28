'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, Supplier, ProductImportAnalysis } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List, FileDown, Scan, RefreshCw, FileUp, ShieldAlert, Loader2, Trash2, Tag, Printer } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { InventoryStats } from '@/components/products/InventoryStats';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import { ProductHistoryDialog } from '@/components/products/ProductHistoryDialog';
import { BarcodeScannerDialog } from '@/components/products/BarcodeScannerDialog';
import { DeleteMultipleProductsDialog } from '@/components/products/DeleteMultipleProductsDialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { api } from '@/lib/api-client';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { CsvImporter } from '@/lib/csv-utils';

/**
 * @fileOverview Sovereign Product Management (Finalized)
 */

export default function ProductsPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, products, isLoading, viewMode } = useAppStore(state => ({
        profile: state.profile,
        products: state.products,
        isLoading: state.isLoading.products,
        viewMode: state.productViewMode
    }));
    const { refreshProducts, setProductViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    
    const [categories, setCategories] = useState<string[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importAnalysis, setImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // Absolute Role Guard
    useEffect(() => {
        if (profile && !isManagerOrAdmin) {
            toast.error("Accès restreint", { description: "Seuls les gérants peuvent accéder à l'inventaire." });
            router.replace('/sell');
        }
    }, [profile, isManagerOrAdmin, router]);

    useEffect(() => {
        if (isManagerOrAdmin) {
            refreshProducts(debouncedSearchQuery);
        }
    }, [debouncedSearchQuery, refreshProducts, isManagerOrAdmin]);

    useEffect(() => {
        if (isManagerOrAdmin) {
            api.get<string[]>('products/categories').then(setCategories);
            api.get<Supplier[]>('suppliers').then(setSuppliers);
        }
    }, [isManagerOrAdmin]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.uuid)));
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const analysis = await CsvImporter.analyzeProducts(file);
            setImportAnalysis(analysis);
            setIsImportPreviewOpen(true);
        } catch (error: any) {
            toast.error("Erreur lors de l'analyse.");
        } finally {
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

    const selectedProductsData = useMemo(() => {
        return products.filter(p => selectedProducts.has(p.uuid));
    }, [products, selectedProducts]);

    if (!profile || !isManagerOrAdmin) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="p-6 bg-primary/5 rounded-[3rem] border border-primary/10 shadow-2xl relative overflow-hidden group">
                    <ShieldAlert className="h-16 w-16 text-primary animate-pulse relative z-10" />
                    <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Accès Restreint • Terminal iPOS</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Souveraineté de l'Inventaire" 
                description="Gestion absolue du catalogue, des prix et des stocks stratégiques."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => CsvImporter.exportProducts(products)} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <FileUp className="h-4 w-4" /> Exporter
                    </Button>
                    <Button asChild variant="outline" className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2">
                        <label className="cursor-pointer">
                            <FileDown className="h-4 w-4" /> Importer
                            <input type="file" accept=".csv" className="hidden" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest gap-2">
                        <Plus className="h-4 w-4" /> Nouveau Produit
                    </Button>
                </div>
            </PageHeader>

            <InventoryStats products={products} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow flex gap-3 group">
                    <div className="relative flex-grow">
                        <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                        <Input 
                            placeholder="Rechercher par nom, catégorie ou code-barres..."
                            className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-sm relative z-10"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-14 w-14 luxury-glass rounded-2xl border-white/10 hover:bg-primary/10 transition-all group" onClick={() => setIsScannerOpen(true)}>
                        <Scan className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    </Button>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5">
                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-white/5">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-10 w-10 rounded-lg" onClick={() => setProductViewMode('grid')}>
                            <LayoutGrid className="h-4.5 w-4.5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-10 w-10 rounded-lg" onClick={() => setProductViewMode('list')}>
                            <List className="h-4.5 w-4.5"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={() => refreshProducts(searchQuery)} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedProducts.size > 0 && (
                <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-[1.5rem] p-4 animate-in slide-in-from-top-4 duration-500 shadow-lg">
                    <div className="flex items-center gap-4">
                        <Badge className="bg-primary text-primary-foreground px-4 py-1.5 rounded-xl font-black text-xs">
                            {selectedProducts.size} sélectionné(s)
                        </Badge>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Actions sur la sélection</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setIsPrintLabelsOpen(true)} 
                            className="rounded-xl border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-5"
                        >
                            <Printer className="h-4 w-4" /> Étiquettes
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsBulkDeleteOpen(true)} 
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-5"
                        >
                            <Trash2 className="h-4 w-4" /> Supprimer
                        </Button>
                    </div>
                </div>
            )}

            <div className="min-h-[500px]">
               {isLoading && products.length === 0 ? <ProductTableSkeleton /> : (
                   viewMode === 'grid' ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                           {products.map(p => (
                               <ProductCard 
                                    key={p.uuid} 
                                    product={p} 
                                    onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} 
                                    onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} 
                                    onDuplicate={(p) => { const { uuid, ...rest } = p; setSelectedProduct(rest); setIsProductDialogOpen(true); }} 
                                    onViewHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }}
                                    isSelected={selectedProducts.has(p.uuid)}
                                    onToggleSelection={() => handleToggleSelection(p.uuid)}
                                />
                           ))}
                       </div>
                   ) : (
                       <ProductTable 
                            products={products} 
                            onEdit={(p) => { setSelectedProduct(p); setIsProductDialogOpen(true); }} 
                            onDelete={(p) => { setSelectedProduct(p); setIsDeleteDialogOpen(true); }} 
                            onDuplicate={(p) => { const { uuid, ...rest } = p; setSelectedProduct(rest); setIsProductDialogOpen(true); }} 
                            onViewHistory={(p) => { setSelectedProduct(p); setIsHistoryDialogOpen(true); }} 
                            suppliers={suppliers} 
                            selectedProducts={selectedProducts}
                            onToggleSelection={handleToggleSelection}
                            onToggleAll={handleSelectAll}
                        />
                   )
               )}
            </div>

            {/* Dialogs Integration */}
            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} categories={categories} suppliers={suppliers} onSuccess={() => { refreshProducts(); setSelectedProducts(new Set()); }} />
            <DeleteProductDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} product={selectedProduct as Product} onSuccess={() => refreshProducts()} />
            <ProductHistoryDialog isOpen={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen} product={selectedProduct as Product} />
            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={(b) => setSearchQuery(b)} />
            <ProductImportPreviewDialog isOpen={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen} analysis={importAnalysis} onConfirm={handleConfirmImport} isImporting={isImporting} />
            <DeleteMultipleProductsDialog isOpen={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen} productUuids={Array.from(selectedProducts)} onSuccess={() => { setSelectedProducts(new Set()); refreshProducts(); }} />
            <PrintLabelsDialog isOpen={isPrintLabelsOpen} onOpenChange={setIsPrintLabelsOpen} products={selectedProductsData} />
        </div>
    );
}

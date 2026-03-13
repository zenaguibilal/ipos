
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product, ProductImportAnalysis, Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, LayoutGrid, List, Printer, Trash2, PackageCheck, PackageX, AlertTriangle, Archive, SortAsc, FileDown, FileUp, Building } from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductTable } from '@/components/products/product-table';
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton';
import { ProductTableSkeleton } from '@/components/products/product-table-skeleton';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DeleteMultipleProductsDialog } from '@/components/products/DeleteMultipleProductsDialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { ProductImportPreviewDialog } from '@/components/products/ProductImportPreviewDialog';
import { InventoryStats } from '@/components/products/InventoryStats';
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
import Papa from 'papaparse';

type ViewMode = 'grid' | 'list';
type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

const stockStatusOptions: { value: StockStatus, label: string, icon: React.ElementType }[] = [
    { value: 'all', label: 'Tous les statuts', icon: Archive },
    { value: 'in_stock', label: 'En Stock', icon: PackageCheck },
    { value: 'low_stock', label: 'Stock Faible', icon: AlertTriangle },
    { value: 'out_of_stock', label: 'En Rupture', icon: PackageX },
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
};

export default function ProductsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [stockStatus, setStockStatus] = useState<StockStatus>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState('createdAt_desc');

    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
    
    const [isProductImportPreviewOpen, setIsProductImportPreviewOpen] = useState(false);
    const [productImportAnalysis, setProductImportAnalysis] = useState<ProductImportAnalysis | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const products = useLiveQuery(
        () => dataService.getProducts({ 
            query: debouncedSearchQuery, 
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            supplierId: selectedSupplier === 'all' ? undefined : parseInt(selectedSupplier),
            stockStatus: stockStatus,
            sortBy: sortBy,
        }),
        [debouncedSearchQuery, selectedCategory, selectedSupplier, stockStatus, sortBy],
        []
    );
    
    const categories = useLiveQuery(() => dataService.getProductCategories(), [], []);
    const suppliers = useLiveQuery(() => dataService.getSuppliers(), [], []);
    
    const isLoading = products === undefined || categories === undefined || suppliers === undefined;

    useEffect(() => {
        // Clear selection when filters change
        setSelectedProducts(new Set());
    }, [debouncedSearchQuery, selectedCategory, stockStatus, selectedSupplier]);

    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    };

    const handleDeleteProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteDialogOpen(true);
    };

    const handleToggleSelection = (productId: number) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };
    
    const handleToggleSelectAll = () => {
        if (!products) return;
        if (selectedProducts.size === products.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(products.map(p => p.id as number).filter(id => typeof id === 'number')));
        }
    }

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    const analysis = await dataService.analyzeProductImport(results.data);
                    setProductImportAnalysis(analysis);
                    setIsProductImportPreviewOpen(true);
                },
                error: (error) => {
                    toast.error("Erreur lors de l'analyse du fichier CSV.", { description: error.message });
                }
            });
        }
        if (e.target) e.target.value = '';
    };

    const handleConfirmImport = async (confirmedData: { toAdd: any[], toUpdate: any[] }) => {
        setIsImporting(true);
        try {
            await dataService.processProductImport(confirmedData.toAdd, confirmedData.toUpdate);
            toast.success("Importation des produits terminée avec succès !");
            setIsProductImportPreviewOpen(false);
            setProductImportAnalysis(null);
        } catch (error) {
            console.error("Product import failed:", error);
            toast.error("Une erreur est survenue lors de l'importation.");
        } finally {
            setIsImporting(false);
        }
    };
    
    const handleExport = async () => {
        toast.info("Préparation de l'exportation des produits...");
        try {
            const csvString = await dataService.exportProductsToCSV();
            const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `export-produits-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Exportation terminée avec succès.");
        } catch (error) {
            toast.error("Erreur lors de l'exportation des produits.");
            console.error(error);
        }
    };
    
    const renderSkeletons = () => (
        [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
    );

    const renderContent = () => {
        if (isLoading) {
            if (viewMode === 'grid') {
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {renderSkeletons()}
                    </div>
                )
            }
            return <ProductTableSkeleton />;
        }

        if (!products || products.length === 0) {
            return (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucun produit trouvé</h3>
                    <p className="text-muted-foreground mt-2">Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouveau produit.</p>
                     <Button className="mt-4" onClick={() => setIsProductDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
                    </Button>
                </div>
            );
        }
        
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(p => (
                       p.id && typeof p.id === 'number' &&
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            onEdit={handleEditProduct} 
                            onDelete={handleDeleteProduct}
                            isSelected={selectedProducts.has(p.id)}
                            onToggleSelection={() => handleToggleSelection(p.id!)}
                        />
                    ))}
                </div>
            );
        }

        return (
            <ProductTable 
                products={products}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
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
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des Produits</h1>
                    <p className="text-muted-foreground">Recherchez, filtrez et gérez votre inventaire.</p>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <label htmlFor="csv-importer">
                            <FileDown className="mr-2 h-4 w-4" /> Importer
                            <input type="file" id="csv-importer" accept=".csv" className="sr-only" onChange={handleFileSelected} />
                        </label>
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={() => { setSelectedProduct(null); setIsProductDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>
            </header>

            <InventoryStats products={products} isLoading={isLoading} />

            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par nom ou code-barres..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
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
                                key={sup.id}
                                checked={selectedSupplier === String(sup.id)}
                                onCheckedChange={() => setSelectedSupplier(String(sup.id))}
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
            
            <div>
               {renderContent()}
            </div>

            <ProductDialog 
                isOpen={isProductDialogOpen}
                onOpenChange={setIsProductDialogOpen}
                product={selectedProduct}
                categories={categories || []}
                suppliers={suppliers || []}
            />
            <DeleteProductDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                product={selectedProduct}
            />
            <PrintLabelsDialog
                isOpen={isPrintDialogOpen}
                onOpenChange={setIsPrintDialogOpen}
                productIds={Array.from(selectedProducts)}
            />
             <DeleteMultipleProductsDialog
                isOpen={isBulkDeleteDialogOpen}
                onOpenChange={setIsBulkDeleteDialogOpen}
                productIds={Array.from(selectedProducts)}
                onSuccess={() => setSelectedProducts(new Set())}
            />
             <ProductImportPreviewDialog
                isOpen={isProductImportPreviewOpen}
                onOpenChange={setIsProductImportPreviewOpen}
                analysis={productImportAnalysis}
                onConfirm={handleConfirmImport}
                isImporting={isImporting}
            />
        </div>
    );
}

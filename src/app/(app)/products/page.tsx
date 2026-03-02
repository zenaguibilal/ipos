'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Package, Layers, CircleDollarSign, AlertTriangle, MoreHorizontal, Download, ChevronDown, LayoutGrid, List, Printer } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products/product-card';
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton';
import { ProductTable } from '@/components/products/product-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';
import { useDebounce } from '@/hooks/useDebounce';

export default function ProductsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

    const { data: searchQuery, mutate: setSearchQuery } = useSWR('products_search_query', async () => (await dataService.getSetting('products_search_query'))?.value || '', { revalidateOnFocus: false });
    const { data: selectedCategory, mutate: setSelectedCategory } = useSWR('products_category_filter', async () => (await dataService.getSetting('products_category_filter'))?.value || 'all', { revalidateOnFocus: false });
    const { data: viewMode, mutate: setViewMode } = useSWR('products_view_mode', async () => (await dataService.getSetting('products_view_mode'))?.value || 'grid', { revalidateOnFocus: false });

    const handleSearchChange = (value: string) => { setSearchQuery(value, false); dataService.setSetting('products_search_query', value); };
    const handleCategoryChange = (value: string) => { setSelectedCategory(value, false); dataService.setSetting('products_category_filter', value); };
    const handleViewModeChange = (value: 'grid' | 'table') => { setViewMode(value, false); dataService.setSetting('products_view_mode', value); };
    
    const debouncedSearchQuery = useDebounce(searchQuery || '', 300);

    const products = useLiveQuery(() => {
        if (selectedCategory === 'all') {
            return db.products.orderBy('name').toArray();
        }
        return db.products.where('category').equals(selectedCategory).sortBy('name');
    }, [selectedCategory]);

    const handleAddClick = () => {
        setSelectedProduct(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    const { 
        categories, totalInventoryValue, lowStockCount, 
        totalProducts, totalCategories 
    } = useMemo(() => {
        if (!products) {
            return { categories: ['all'], totalInventoryValue: 0, lowStockCount: 0, totalProducts: 0, totalCategories: 0 };
        }
        let inventoryValue = 0;
        let lowStock = 0;
        const categorySet = new Set<string>();

        for (const p of products) {
            inventoryValue += (p.purchasePrice || 0) * p.quantity;
            if (p.quantity <= p.minStockLevel) lowStock++;
            if (p.category) categorySet.add(p.category);
        }
        
        const uniqueCategories = ['all', ...Array.from(categorySet).sort()];
        return {
            categories: uniqueCategories,
            totalInventoryValue: inventoryValue,
            lowStockCount: lowStock,
            totalProducts: products.length,
            totalCategories: uniqueCategories.length - 1,
        };
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        if (!debouncedSearchQuery) return products;
        const lowercasedQuery = debouncedSearchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lowercasedQuery) || 
            p.barcodes?.some(b => b.includes(lowercasedQuery))
        );
    }, [products, debouncedSearchQuery]);

     const handleExport = () => {
        if (!filteredProducts || filteredProducts.length === 0) {
            toast.info("Aucun produit à exporter.");
            return;
        }
        const dataToExport = filteredProducts.map(p => ({
            'Nom': p.name, 'Catégorie': p.category || '',
            'Prix Achat': p.purchasePrice, 'Prix Vente': p.price,
            'Quantité': p.quantity, 'Stock Min': p.minStockLevel,
            'Codes-barres': p.barcodes?.join(', ') || '',
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'inventaire_produits.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Inventaire exporté avec succès.");
    };

    const toggleProductSelection = useCallback((productId: number) => {
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id as number)));
        }
    }, [filteredProducts, selectedProducts.size]);

    const isLoading = products === undefined || searchQuery === undefined || selectedCategory === undefined || viewMode === undefined;

    return (
        <>
            <ProductDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} product={selectedProduct} />
            <DeleteProductDialog isOpen={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)} product={productToDelete} />
            <PrintLabelsDialog
                isOpen={isPrintDialogOpen}
                onOpenChange={setIsPrintDialogOpen}
                productIds={Array.from(selectedProducts)}
            />

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Produits</h1>
                        <p className="text-muted-foreground">Ajoutez, modifiez et suivez votre inventaire.</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline">Actions <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exporter en CSV</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddClick}><PlusCircle className="mr-2 h-4 w-4" />Ajouter un produit</Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Produits Totaux</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalProducts}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle><CircleDollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalInventoryValue.toFixed(1)} DA</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stock Faible</CardTitle><AlertTriangle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{lowStockCount}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Catégories</CardTitle><Layers className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{totalCategories}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher par nom ou code-barres..." value={searchQuery || ''} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9 w-full" />
                            </div>
                             <div className="flex items-center gap-2">
                                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrer par catégorie" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat} className="capitalize">{cat === 'all' ? 'Toutes les catégories' : cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex rounded-md bg-muted p-1">
                                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewModeChange('grid')}><LayoutGrid className="h-5 w-5"/></Button>
                                    <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => handleViewModeChange('table')}><List className="h-5 w-5"/></Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                     <div className="px-6 pb-4 border-b flex items-center gap-4">
                        <Checkbox
                            id="select-all-header"
                            checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                            onCheckedChange={toggleSelectAll}
                            disabled={isLoading || filteredProducts.length === 0}
                            aria-label="Select all"
                        />
                        <Label htmlFor="select-all-header" className="text-sm text-muted-foreground flex-grow">
                            {selectedProducts.size} sur {filteredProducts.length} sélectionné(s)
                        </Label>
                        {selectedProducts.size > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setIsPrintDialogOpen(true)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer les étiquettes
                            </Button>
                        )}
                    </div>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {products && products.length > 0 ? "Aucun produit ne correspond à vos filtres." : "Aucun produit trouvé. Commencez par en ajouter un."}
                                </p>
                            </div>
                        ) : (
                            viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {filteredProducts.map((product) => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            onEdit={handleEditClick} 
                                            onDelete={setProductToDelete}
                                            isSelected={selectedProducts.has(product.id as number)}
                                            onToggleSelection={() => toggleProductSelection(product.id as number)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <ProductTable 
                                    products={filteredProducts} 
                                    onEdit={handleEditClick} 
                                    onDelete={setProductToDelete}
                                    selectedProducts={selectedProducts}
                                    onToggleProductSelection={toggleProductSelection}
                                    onToggleSelectAll={toggleSelectAll}
                                />
                            )
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

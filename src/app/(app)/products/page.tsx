'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products/product-card';
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton';
import { ProductTable } from '@/components/products/product-table';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { PrintLabelsDialog } from '@/components/products/PrintLabelsDialog';

import { PlusCircle, Search, LayoutGrid, List, Printer } from 'lucide-react';

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'price' | 'quantity' | 'category';

export default function ProductsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<SortKey>('name');
    
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());

    const debouncedSearch = useDebounce(searchQuery, 300);

    const categories = useLiveQuery(() => dataService.getProductCategories());
    const products = useLiveQuery(
        () => dataService.getProducts({ 
            query: debouncedSearch, 
            category: selectedCategory === 'all' ? undefined : selectedCategory 
        }), 
        [debouncedSearch, selectedCategory]
    );
    
    const sortedProducts = useMemo(() => {
        if (!products) return [];
        const sorted = [...products].sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            
            if (typeof valA === 'string' && typeof valB === 'string') {
                return valA.localeCompare(valB);
            }
            if (typeof valA === 'number' && typeof valB === 'number') {
                return valA - valB;
            }
            // Fallback for undefined categories
            if (valA === undefined) return 1;
            if (valB === undefined) return -1;

            return 0;
        });

        return sorted;
    }, [products, sortBy]);


    const handleAddClick = () => {
        setSelectedProduct(null);
        setIsProductDialogOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsProductDialogOpen(true);
    };

    const handleDeleteClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDeleteDialogOpen(true);
    };

    const handleToggleSelection = useCallback((productId: number) => {
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

    const handleToggleSelectAll = useCallback(() => {
        if (sortedProducts && selectedProducts.size === sortedProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(sortedProducts?.map(p => p.id as number).filter(id => typeof id === 'number')));
        }
    }, [sortedProducts, selectedProducts.size]);

    const isLoading = products === undefined || categories === undefined;
    
    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Gestion des Produits</h1>
                <p className="text-muted-foreground">Ajoutez, modifiez et organisez vos produits.</p>
            </header>

            <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-grow min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher par nom ou code-barres..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {categories?.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Nom</SelectItem>
                        <SelectItem value="price">Prix</SelectItem>
                        <SelectItem value="quantity">Stock</SelectItem>
                        <SelectItem value="category">Catégorie</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-1">
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4"/></Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4"/></Button>
                </div>
                <Button onClick={handleAddClick}><PlusCircle className="mr-2 h-4 w-4"/> Ajouter</Button>
            </div>
            
            {selectedProducts.size > 0 && (
                <div className="flex items-center gap-4 bg-muted p-2 rounded-lg mb-4 border">
                    <p className="text-sm font-medium flex-grow">{selectedProducts.size} produit(s) sélectionné(s)</p>
                    <Button variant="outline" size="sm" onClick={() => setIsPrintDialogOpen(true)}><Printer className="mr-2 h-4 w-4"/> Imprimer étiquettes</Button>
                </div>
            )}

            <div className="flex-grow overflow-y-auto -mx-4 px-4 pb-4">
                 {isLoading ? (
                     <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
                         {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                     </div>
                 ) : sortedProducts && sortedProducts.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {sortedProducts.map(p => (
                                <ProductCard 
                                    key={p.id} 
                                    product={p} 
                                    onEdit={handleEditClick} 
                                    onDelete={handleDeleteClick}
                                    isSelected={selectedProducts.has(p.id as number)}
                                    onToggleSelection={() => handleToggleSelection(p.id as number)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ProductTable 
                            products={sortedProducts} 
                            onEdit={handleEditClick} 
                            onDelete={handleDeleteClick}
                            selectedProducts={selectedProducts}
                            onToggleProductSelection={handleToggleSelection}
                            onToggleSelectAll={handleToggleSelectAll}
                        />
                    )
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <p className="text-lg font-semibold">Aucun produit trouvé</p>
                        <p>Essayez d'ajuster votre recherche ou vos filtres, ou ajoutez un nouveau produit.</p>
                    </div>
                 )}
            </div>
            
            <ProductDialog isOpen={isProductDialogOpen} onOpenChange={setIsProductDialogOpen} product={selectedProduct} />
            <DeleteProductDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} product={selectedProduct} />
            <PrintLabelsDialog isOpen={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen} productIds={Array.from(selectedProducts)} />
        </div>
    );
}

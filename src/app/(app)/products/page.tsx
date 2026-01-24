
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Package, Layers, CircleDollarSign, AlertTriangle, MoreHorizontal, Download, ChevronDown } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductCard } from '@/components/products/product-card';
import { ProductCardSkeleton } from '@/components/products/product-card-skeleton';

export default function ProductsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const productsQuery = useMemoFirebase(() =>
        (user && firestore) ? query(collection(firestore, 'users', user.uid, 'products'), orderBy('createdAt', 'desc')) : null,
    [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const handleAddClick = () => {
        setSelectedProduct(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setIsDialogOpen(true);
    };

    const categories = useMemo(() => {
        if (!products) return [];
        const allCategories = products.map(p => p.category).filter(Boolean) as string[];
        return ['all', ...Array.from(new Set(allCategories))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        
        let tempProducts = [...products];

        if (selectedCategory !== 'all') {
            tempProducts = tempProducts.filter(p => p.category === selectedCategory);
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            tempProducts = tempProducts.filter(p => 
                p.name.toLowerCase().includes(lowercasedQuery) ||
                p.barcodes?.some(b => b.includes(lowercasedQuery))
            );
        }
        
        return tempProducts;
    }, [products, searchQuery, selectedCategory]);

    const { totalInventoryValue, lowStockCount, totalProducts, totalCategories } = useMemo(() => {
        if (!products) return { totalInventoryValue: 0, lowStockCount: 0, totalProducts: 0, totalCategories: 0 };
        return {
            totalInventoryValue: products.reduce((sum, p) => sum + (p.purchasePrice || 0) * p.quantity, 0),
            lowStockCount: products.filter(p => p.quantity <= p.minStockLevel).length,
            totalProducts: products.length,
            totalCategories: categories.length > 1 ? categories.length - 1 : 0, // Exclude 'all'
        }
    }, [products, categories]);
    
     const handleExport = () => {
        if (filteredProducts.length === 0) {
            toast.info("Aucun produit à exporter.");
            return;
        }

        const dataToExport = filteredProducts.map(p => ({
            'Nom': p.name,
            'Catégorie': p.category || '',
            'Prix Achat': p.purchasePrice,
            'Prix Vente': p.price,
            'Quantité': p.quantity,
            'Stock Min': p.minStockLevel,
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

    const isLoading = isUserLoading || isLoadingProducts;

    if (!user && !isLoading) {
        return null; // or a loading spinner, redirect is handled by useEffect
    }

    return (
        <>
            {user && (
                <>
                    <ProductDialog
                        isOpen={isDialogOpen}
                        onOpenChange={setIsDialogOpen}
                        product={selectedProduct}
                        userId={user.uid}
                    />
                    <DeleteProductDialog
                        isOpen={!!productToDelete}
                        onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}
                        product={productToDelete}
                        userId={user.uid}
                    />
                </>
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Produits</h1>
                        <p className="text-muted-foreground">Ajoutez, modifiez et suivez votre inventaire.</p>
                    </div>
                     <div className="flex items-center gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Actions <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Exporter en CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un produit
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Produits Totaux</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalInventoryValue.toFixed(1)} DA</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCategories}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher par nom ou code-barres..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full"
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filtrer par catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat} className="capitalize">
                                            {cat === 'all' ? 'Toutes les catégories' : cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredProducts.map((product) => (
                                    <ProductCard 
                                        key={product.id}
                                        product={product}
                                        onEdit={handleEditClick}
                                        onDelete={setProductToDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Package, Layers, CircleDollarSign, AlertTriangle } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductDialog } from '@/components/products/product-dialog';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ProductsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcodes?.some(b => b.includes(searchQuery))
        );
    }, [products, searchQuery]);

    const { totalInventoryValue, lowStockCount, totalProducts } = useMemo(() => {
        if (!products) return { totalInventoryValue: 0, lowStockCount: 0, totalProducts: 0 };
        return {
            totalInventoryValue: products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0),
            lowStockCount: products.filter(p => p.quantity <= p.minStockLevel).length,
            totalProducts: products.length,
        }
    }, [products]);

    const isLoading = isUserLoading || isLoadingProducts;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement des produits...</p></div>;
    }

    return (
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
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Produits</h1>
                        <p className="text-muted-foreground">Ajoutez, modifiez et suivez votre inventaire.</p>
                    </div>
                    <Button onClick={handleAddClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un produit
                    </Button>
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
                            <div className="text-2xl font-bold">{[...new Set(products?.map(p => p.category).filter(Boolean))].length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par nom ou code-barres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredProducts.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {products && products.length > 0 ? "Aucun produit ne correspond à votre recherche." : "Aucun produit trouvé. Commencez par en ajouter un."}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[60px]">Image</TableHead>
                                            <TableHead>Produit</TableHead>
                                            <TableHead>Catégorie</TableHead>
                                            <TableHead className="text-right">Prix Achat</TableHead>
                                            <TableHead className="text-right">Prix Vente</TableHead>
                                            <TableHead className="text-center">Stock</TableHead>
                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <Image 
                                                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/40`}
                                                        alt={product.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-md object-cover"
                                                        data-ai-hint={product.name.split(' ').slice(0,2).join(' ')}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{product.category || 'N/A'}</TableCell>
                                                <TableCell className="text-right">{product.purchasePrice.toFixed(1)} DA</TableCell>
                                                <TableCell className="text-right font-semibold text-primary">{product.price.toFixed(1)} DA</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={product.quantity <= product.minStockLevel ? 'destructive' : 'secondary'}>
                                                        {product.quantity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditClick(product)}>Modifier</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setProductToDelete(product)} className="text-destructive">Supprimer</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

    

'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AddProductForm } from '@/components/products/add-product-form';
import { EditProductForm } from '@/components/products/edit-product-form';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface Product {
    id: string;
    name: string;
    price: number; // Selling price
    purchasePrice: number;
    quantity: number;
    minStockLevel: number;
    barcode?: string;
}

export default function ProductsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        
        const lowercasedQuery = searchQuery.toLowerCase();
        
        return products?.filter(product => 
            product.name.toLowerCase().includes(lowercasedQuery) ||
            (product.barcode && product.barcode.toLowerCase().includes(lowercasedQuery))
        );
    }, [products, searchQuery]);
    
    const handleDeleteProduct = () => {
        if (!deletingProduct || !firestore || !user) return;
        const productDocRef = doc(firestore, 'users', user.uid, 'products', deletingProduct.id);
        deleteDocumentNonBlocking(productDocRef, {
            onSuccess: () => setDeletingProduct(null),
            onError: (err) => console.error("Failed to delete product:", err)
        });
    }

    const isLoading = isUserLoading || isLoadingProducts;

    if (isLoading || !user) {
        return <div className="flex min-h-screen items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <AddProductForm 
                isOpen={isAddingProduct}
                onOpenChange={setIsAddingProduct}
                userId={user.uid}
            />
            {editingProduct && (
                 <EditProductForm
                    isOpen={!!editingProduct}
                    onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}
                    userId={user.uid}
                    product={editingProduct}
                />
            )}
            {deletingProduct && (
                <DeleteProductDialog
                    isOpen={!!deletingProduct}
                    onOpenChange={(isOpen) => !isOpen && setDeletingProduct(null)}
                    onConfirm={handleDeleteProduct}
                    productName={deletingProduct.name}
                />
            )}
           
            <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
                <Card className="w-full max-w-7xl">
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Produits</CardTitle>
                                <CardDescription>Gérez votre inventaire de produits.</CardDescription>
                            </div>
                            <Button onClick={() => setIsAddingProduct(true)}>Ajouter un produit</Button>
                        </div>
                         <div className="pt-4">
                            <Input 
                                placeholder="Rechercher par nom ou code-barres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : filteredProducts && filteredProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Code-barres</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Prix Achat</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Prix Vente</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Quantité</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock Min.</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredProducts.map(product => {
                                            const isLowStock = product.quantity <= product.minStockLevel;
                                            return (
                                                <tr key={product.id} className={cn(isLowStock && 'bg-destructive/10')}>
                                                    <td className="whitespace-nowrap px-6 py-4 font-medium">{product.name}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{product.barcode || '-'}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{product.purchasePrice.toFixed(2)} €</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{product.price.toFixed(2)} €</td>
                                                    <td className={cn("whitespace-nowrap px-6 py-4 text-right font-medium", isLowStock && 'text-destructive font-bold')}>{product.quantity}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{product.minStockLevel}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Ouvrir le menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                                                    Modifier
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setDeletingProduct(product)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                                    Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : products && products.length > 0 && searchQuery ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche.</p>
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Vous n'avez pas encore de produits.</p>
                                    <Button variant="link" onClick={() => setIsAddingProduct(true)}>Ajouter votre premier produit</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/dashboard">Retour au tableau de bord</Link>
                </Button>
            </div>
        </>
    );
}

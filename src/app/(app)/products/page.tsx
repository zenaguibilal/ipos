
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddProductForm } from '@/components/products/add-product-form';
import { EditProductForm } from '@/components/products/edit-product-form';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { ImportProductsDialog } from '@/components/products/import-products-dialog';
import { MoreHorizontal, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/types';
import { toast } from 'sonner';


type ProductWithOptionalBarcode = Product & { barcode?: string };

export default function ProductsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductWithOptionalBarcode>(productsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const sortedProducts = [...products].sort((a,b) => a.name.localeCompare(b.name));
        if (!searchQuery) return sortedProducts;
        
        const lowercasedQuery = searchQuery.toLowerCase();
        
        return sortedProducts.filter(product => 
            product.name.toLowerCase().includes(lowercasedQuery) ||
            (product.barcodes && product.barcodes.some(b => b.toLowerCase().includes(lowercasedQuery))) ||
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

    const handleExportToCSV = () => {
        if (!products) {
            toast.error("Aucun produit à exporter.");
            return;
        }

        const headers = ['id', 'name', 'price', 'purchasePrice', 'quantity', 'minStockLevel', 'barcodes'];
        const csvRows = [headers.join(';')]; // Utiliser un point-virgule comme délimiteur

        products.forEach(product => {
            const row = [
                product.id,
                `"${product.name.replace(/"/g, '""')}"`,
                product.price,
                product.purchasePrice,
                product.quantity,
                product.minStockLevel,
                `"${(product.barcodes || []).join(',')}"` // Garder la virgule pour les codes-barres internes
            ];
            csvRows.push(row.join(';')); // Utiliser un point-virgule comme délimiteur
        });

        const csvString = csvRows.join('\n');
        // Ajouter un BOM pour garantir la bonne interprétation de l'UTF-8 dans Excel
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'produits.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Produits exportés avec succès.");
    };

    const isLoading = isUserLoading || isLoadingProducts;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <AddProductForm 
                isOpen={isAddingProduct}
                onOpenChange={setIsAddingProduct}
                userId={user.uid}
            />
            <ImportProductsDialog
                isOpen={isImporting}
                onOpenChange={setIsImporting}
                userId={user.uid}
                existingProducts={products || []}
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
           
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full h-full flex flex-col bg-card">
                    <CardHeader>
                        <CardTitle>Produits</CardTitle>
                        <CardDescription>
                            Gérez vos produits. Vous avez actuellement {products?.length || 0} produits dans votre inventaire.
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                            <Input 
                                placeholder="Rechercher par nom ou code-barres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-auto sm:flex-grow max-w-sm"
                            />
                            <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
                                 <Button variant="outline" onClick={handleExportToCSV}><Download className="mr-2 h-4 w-4" />Exporter</Button>
                                <Button variant="outline" onClick={() => setIsImporting(true)}><Upload className="mr-2 h-4 w-4" />Importer</Button>
                                <Button onClick={() => setIsAddingProduct(true)} className="flex-grow sm:flex-grow-0">Ajouter un produit</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : filteredProducts && filteredProducts.length > 0 ? (
                            <div className="h-full overflow-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nom</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Codes-barres</th>
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
                                            const displayBarcodes = product.barcodes?.join(', ') || product.barcode || '-';
                                            return (
                                                <tr key={product.id} className={cn("hover:bg-muted/50", isLowStock && 'bg-destructive/10 hover:bg-destructive/20')}>
                                                    <td className="whitespace-nowrap px-6 py-4 font-medium">{product.name}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{displayBarcodes}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{product.purchasePrice.toFixed(2)} DA</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right font-medium">{product.price.toFixed(2)} DA</td>
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
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Modifier</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setDeletingProduct(product)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    <span>Supprimer</span>
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
            </main>
        </>
    );
}

    
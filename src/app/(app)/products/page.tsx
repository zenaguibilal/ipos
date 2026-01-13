
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddProductForm } from '@/components/products/add-product-form';
import { EditProductForm } from '@/components/products/edit-product-form';
import { DeleteProductDialog } from '@/components/products/delete-product-dialog';
import { ProductImportDialog } from '@/components/products/product-import-dialog';
import { MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Papa from 'papaparse';
import Image from 'next/image';


interface ProductWithProfit extends Product {
    profitMargin?: number;
}

type SortableKeys = keyof Pick<ProductWithProfit, 'name' | 'price' | 'purchasePrice' | 'quantity' | 'profitMargin'>;

export default function ProductsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });

    // Fetch Products
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
    
    const sortedAndFilteredProducts = useMemo(() => {
        if (!products) return [];
        let sortableItems: ProductWithProfit[] = products.map(p => {
             const profit = p.price - p.purchasePrice;
             const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
             return { ...p, profitMargin: margin };
        });

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined) return 1;
                if (bValue === undefined) return -1;
                
                let comparison = 0;
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        if (!searchQuery) return sortableItems;
        
        const lowercasedQuery = searchQuery.toLowerCase();
        
        return sortableItems.filter(product => 
            product.name.toLowerCase().includes(lowercasedQuery) ||
            (product.barcodes && product.barcodes.some(b => b.includes(lowercasedQuery)))
        );
    }, [products, searchQuery, sortConfig]);

     const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
    };
    
    const handleDeleteProduct = () => {
        if (!deletingProduct || !firestore || !user) return;
        const productDocRef = doc(firestore, 'users', user.uid, 'products', deletingProduct.id);
        deleteDocumentNonBlocking(productDocRef, {
            onSuccess: () => {
                setDeletingProduct(null);
                toast.success(`Le produit "${deletingProduct.name}" a été supprimé.`);
            },
            onError: (err) => {
                console.error("Failed to delete product:", err);
                toast.error("Échec de la suppression du produit.");
            }
        });
    }

    const handleExportToCSV = () => {
        if (!products) {
            toast.error("Aucun produit à exporter.");
            return;
        }
        const csvData = products.map(p => ({
            "id": p.id,
            "name": p.name,
            "purchasePrice": p.purchasePrice,
            "price": p.price,
            "quantity": p.quantity,
            "minStockLevel": p.minStockLevel,
            "barcodes": p.barcodes?.join(',') || '',
            "imageUrl": p.imageUrl || ''
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `produits_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Produits exportés avec succès.");
    };

    const handleImportCSV = async (file: File) => {
        if (!firestore || !user) return;
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const importedProducts = results.data as any[];
                if (!products) return;

                const batch = writeBatch(firestore);
                let updatedCount = 0;
                let addedCount = 0;

                for (const imported of importedProducts) {
                     const existingProduct = products.find(p => p.name.toLowerCase() === imported.name?.toLowerCase());

                     const productData = {
                        name: imported.name,
                        purchasePrice: parseFloat(imported.purchasePrice) || 0,
                        price: parseFloat(imported.price) || 0,
                        quantity: parseInt(imported.quantity, 10) || 0,
                        minStockLevel: parseInt(imported.minStockLevel, 10) || 0,
                        barcodes: imported.barcodes?.split(',').map((b:string) => b.trim()) || [],
                        imageUrl: imported.imageUrl || ''
                     };
                     
                     if (existingProduct) {
                         const docRef = doc(firestore, 'users', user.uid, 'products', existingProduct.id);
                         batch.update(docRef, productData);
                         updatedCount++;
                     } else {
                         const docRef = doc(collection(firestore, 'users', user.uid, 'products'));
                         batch.set(docRef, productData);
                         addedCount++;
                     }
                }

                try {
                    await batch.commit();
                    toast.success(`${updatedCount} produit(s) mis à jour et ${addedCount} produit(s) ajouté(s).`);
                } catch (error) {
                    toast.error("Erreur lors de l'importation des produits.");
                    console.error(error);
                }
            },
            error: (error: any) => {
                toast.error("Erreur lors de la lecture du fichier CSV.");
                console.error(error);
            }
        });
    };

    const isLoading = isUserLoading || isLoadingProducts;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    const SortableHeader = ({ sortKey, children, className }: { sortKey: SortableKeys, children: React.ReactNode, className?: string }) => (
        <th scope="col" className={cn("px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground", className)}>
            <button onClick={() => requestSort(sortKey)} className="flex items-center">
                {children}
                {getSortIcon(sortKey)}
            </button>
        </th>
    );

    const getProfitMarginColor = (margin: number) => {
        if (margin > 50) return "text-green-500";
        if (margin > 20) return "text-yellow-500";
        return "text-red-500";
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
             <ProductImportDialog
                isOpen={isImporting}
                onOpenChange={setIsImporting}
                onConfirm={handleImportCSV}
            />
           
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <Card className="w-full bg-card">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-2">
                        <Input 
                            placeholder="Rechercher par nom ou code-barres..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-sm order-1 sm:order-1"
                        />
                         <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-2">
                            <Button variant="outline" onClick={() => setIsImporting(true)}>
                                <Upload className="mr-2 h-4 w-4" /> Importer CSV
                            </Button>
                            <Button variant="outline" onClick={handleExportToCSV}>
                                <Download className="mr-2 h-4 w-4" /> Exporter CSV
                            </Button>
                            <Button onClick={() => setIsAddingProduct(true)} className="flex-grow">Ajouter un produit</Button>
                         </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : sortedAndFilteredProducts && sortedAndFilteredProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Image</TableHead>
                                            <SortableHeader sortKey="name" className="text-left">Produit</SortableHeader>
                                            <TableHead className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Codes-barres</TableHead>
                                            <SortableHeader sortKey="purchasePrice" className="text-right">Prix d'achat</SortableHeader>
                                            <SortableHeader sortKey="price" className="text-right">Prix de vente</SortableHeader>
                                            <SortableHeader sortKey="profitMargin" className="text-right">Marge Bénéfice</SortableHeader>
                                            <SortableHeader sortKey="quantity" className="text-right">Quantité</SortableHeader>
                                            <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock Min.</TableHead>
                                            <TableHead className="relative px-4 py-3">
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedAndFilteredProducts.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted">
                                                        {product.imageUrl ? (
                                                            <Image src={product.imageUrl} alt={product.name} fill style={{objectFit: 'cover'}} />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full w-full">
                                                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{product.barcodes?.join(', ') || '-'}</TableCell>
                                                <TableCell className="text-right">{product.purchasePrice.toFixed(2)} DA</TableCell>
                                                <TableCell className="text-right font-semibold text-primary">{product.price.toFixed(2)} DA</TableCell>
                                                 <TableCell className={cn("text-right font-bold", getProfitMarginColor(product.profitMargin || 0))}>
                                                    {product.profitMargin !== undefined ? `${product.profitMargin.toFixed(1)}%` : '-'}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-bold",
                                                    product.quantity <= product.minStockLevel && product.quantity > 0 && "text-yellow-500",
                                                    product.quantity === 0 && "text-destructive"
                                                )}>
                                                    {product.quantity}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">{product.minStockLevel}</TableCell>
                                                <TableCell className="text-right">
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
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
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

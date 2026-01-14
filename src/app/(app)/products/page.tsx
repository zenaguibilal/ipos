
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddProductForm } from './add-product-form';
import { EditProductForm } from './edit-product-form';
import { DeleteProductDialog } from './delete-product-dialog';
import { ProductImportDialog } from './product-import-dialog';
import { MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown, Upload, Download, Image as ImageIcon, FilePlus2, ListOrdered, ShoppingCart, Search } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Papa from 'papaparse';
import Image from 'next/image';
import Link from 'next/link';


interface ProductWithLegacyBarcode extends Product {
    barcode?: string;
    profitMargin?: number;
}


type SortableKeys = keyof Pick<ProductWithLegacyBarcode, 'name' | 'price' | 'purchasePrice' | 'quantity' | 'profitMargin'>;

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
    const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
    
    const selectedProductIds = useMemo(() => Object.keys(selectedProducts).filter(id => selectedProducts[id]), [selectedProducts]);


    // Fetch Products
    const productsCollectionRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'products');
    }, [user, firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductWithLegacyBarcode>(productsCollectionRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);
    
    const sortedAndFilteredProducts = useMemo(() => {
        if (!products) return [];
        let sortableItems: ProductWithLegacyBarcode[] = products.map(p => {
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
            (product.barcodes && product.barcodes.some(b => b.includes(lowercasedQuery))) ||
            (product.barcode && product.barcode.includes(lowercasedQuery))
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
            "barcodes": p.barcodes?.join(',') || p.barcode || '', // Handle both cases
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
    
    const handleCreatePurchaseOrder = () => {
        if (!firestore || !user || !products) return;
        if (selectedProductIds.length === 0) {
            toast.info("Veuillez sélectionner au moins un produit pour créer un bon de commande.");
            return;
        }

        const poItems = selectedProductIds.map(id => {
            const product = products.find(p => p.id === id);
            return {
                productId: id,
                productName: product?.name || '',
                quantity: 1, // Default quantity
                purchasePrice: product?.purchasePrice || 0
            }
        });
        
        const poRef = collection(firestore, 'users', user.uid, 'purchaseOrders');
        
        addDocumentNonBlocking(poRef, {
            poNumber: `BC-${Date.now()}`,
            supplier: 'Fournisseur non spécifié',
            items: poItems,
            totalValue: poItems.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0),
            status: 'pending',
            createdAt: serverTimestamp()
        }, {
            onSuccess: () => {
                toast.success("Bon de commande créé avec succès. Vous pouvez le gérer dans la page des BCs.");
                setSelectedProducts({});
            },
            onError: (err) => {
                console.error("Failed to create PO:", err);
                toast.error("Échec de la création du bon de commande.");
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
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-4">
                        <div className="relative flex-grow w-full sm:w-auto sm:flex-grow-0 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Rechercher par nom ou code-barres..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>
                         <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-start sm:justify-end">
                            {selectedProductIds.length > 0 && (
                                 <Button variant="outline" onClick={handleCreatePurchaseOrder}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Créer BC ({selectedProductIds.length})
                                </Button>
                            )}
                            <Button asChild variant="outline">
                                <Link href="/products/purchase-orders">
                                    <ListOrdered className="mr-2 h-4 w-4" /> Gérer les BC
                                </Link>
                            </Button>
                           
                            <Button variant="outline" onClick={() => setIsImporting(true)}>
                                <Upload className="mr-2 h-4 w-4" /> Importer
                            </Button>
                            <Button variant="outline" onClick={handleExportToCSV}>
                                <Download className="mr-2 h-4 w-4" /> Exporter
                            </Button>
                            <Button onClick={() => setIsAddingProduct(true)}>
                                <FilePlus2 className="mr-2 h-4 w-4" /> Ajouter
                            </Button>
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
                                            <TableHead padding="checkbox" className="px-4">
                                                <Checkbox
                                                    checked={selectedProductIds.length > 0 && selectedProductIds.length === sortedAndFilteredProducts.length}
                                                    onCheckedChange={(checked) => {
                                                        const newSelected: Record<string, boolean> = {};
                                                        if (checked) {
                                                            sortedAndFilteredProducts.forEach(p => newSelected[p.id] = true);
                                                        }
                                                        setSelectedProducts(newSelected);
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Image</TableHead>
                                            <SortableHeader sortKey="name" className="text-left">Produit</SortableHeader>
                                            <TableHead className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Codes-barres</TableHead>
                                            <SortableHeader sortKey="purchasePrice" className="text-right hidden sm:table-cell">Prix d'achat</SortableHeader>
                                            <SortableHeader sortKey="price" className="text-right">Prix de vente</SortableHeader>
                                            <SortableHeader sortKey="profitMargin" className="text-right hidden lg:table-cell">Marge Bénéfice</SortableHeader>
                                            <SortableHeader sortKey="quantity" className="text-right">Quantité</SortableHeader>
                                            <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Stock Min.</TableHead>
                                            <TableHead className="relative px-4 py-3">
                                                <span className="sr-only">Actions</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedAndFilteredProducts.map(product => (
                                            <TableRow key={product.id} data-state={selectedProducts[product.id] && 'selected'}>
                                                <TableCell padding="checkbox" className="px-4">
                                                    <Checkbox
                                                        checked={!!selectedProducts[product.id]}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedProducts(prev => ({...prev, [product.id]: !!checked}));
                                                        }}
                                                    />
                                                </TableCell>
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
                                                <TableCell className="text-muted-foreground text-xs hidden md:table-cell">{(product.barcodes?.join(', ') || product.barcode) || '-'}</TableCell>
                                                <TableCell className="text-right hidden sm:table-cell">{product.purchasePrice.toFixed(2)} DA</TableCell>
                                                <TableCell className="text-right font-semibold text-primary">{product.price.toFixed(2)} DA</TableCell>
                                                 <TableCell className={cn("text-right font-bold hidden lg:table-cell", getProfitMarginColor(product.profitMargin || 0))}>
                                                    {product.profitMargin !== undefined ? `${product.profitMargin.toFixed(1)}%` : '-'}
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-bold",
                                                    product.quantity <= product.minStockLevel && product.quantity > 0 && "text-yellow-500",
                                                    product.quantity === 0 && "text-destructive"
                                                )}>
                                                    {product.quantity}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground hidden md:table-cell">{product.minStockLevel}</TableCell>
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

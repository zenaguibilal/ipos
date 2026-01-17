'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, doc, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddProductForm } from './add-product-form';
import { EditProductForm } from './edit-product-form';
import { DeleteProductDialog } from './delete-product-dialog';
import { ProductImportDialog } from '@/components/products/product-import-dialog';
import { BulkDeleteDialog } from './bulk-delete-dialog';
import { BarcodeLabelDialog } from '@/components/products/barcode-label-dialog';
import { AdjustStockDialog } from '@/components/products/adjust-stock-dialog';
import { CreatePoDialog } from '@/components/products/create-po-dialog';
import { MoreHorizontal, Pencil, Trash2, ArrowUp, ArrowDown, Upload, Download, Image as ImageIcon, PlusCircle, ListOrdered, ShoppingCart, Search, LayoutGrid, List, Barcode, Boxes, ChevronDown, Archive, CircleDollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { Product, PurchaseOrderItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Papa from 'papaparse';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BulkEditCategoryDialog } from './bulk-edit-category-dialog';


interface ProductWithLegacyBarcode extends Product {
    barcode?: string;
    profitMargin?: number;
}


type SortableKeys = keyof Pick<ProductWithLegacyBarcode, 'name' | 'category' | 'price' | 'purchasePrice' | 'quantity' | 'profitMargin'>;

export default function ProductsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [labelProduct, setLabelProduct] = useState<Product | null>(null);
    const [adjustingStockProduct, setAdjustingStockProduct] = useState<Product | null>(null);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
    const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [isCreatingPO, setIsCreatingPO] = useState(false);
    const [productsForPO, setProductsForPO] = useState<Product[]>([]);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    
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

     const categories = useMemo(() => {
        if (!products) return [];
        const allCategories = products
            .map(p => p.category)
            .filter((c): c is string => !!c && c.trim() !== '');
        const uniqueCategories = [...new Set(allCategories)].sort((a,b) => a.localeCompare(b));
        return ['all', ...uniqueCategories];
    }, [products]);
    
    const sortedAndFilteredProducts = useMemo(() => {
        if (!products) return [];

        let processedProducts: ProductWithLegacyBarcode[] = products.map(p => {
             const profit = p.price - p.purchasePrice;
             const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
             return { ...p, profitMargin: margin };
        });

        // 1. Filter by category
        if (selectedCategory !== 'all') {
            processedProducts = processedProducts.filter(p => p.category === selectedCategory);
        }

        // 2. Filter by search query
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            processedProducts = processedProducts.filter(product => 
                product.name.toLowerCase().includes(lowercasedQuery) ||
                (product.category && product.category.toLowerCase().includes(lowercasedQuery)) ||
                (product.barcodes && product.barcodes.some(b => b.includes(lowercasedQuery))) ||
                (product.barcode && product.barcode.includes(lowercasedQuery))
            );
        }
        
        // 3. Sort
        if (sortConfig !== null) {
            processedProducts.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;
                
                let comparison = 0;
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        return processedProducts;
    }, [products, searchQuery, sortConfig, selectedCategory]);

    const {
        totalProducts,
        totalQuantity,
        totalValue
    } = useMemo(() => {
        if (!sortedAndFilteredProducts) return { totalProducts: 0, totalQuantity: 0, totalValue: 0 };
        
        const quantity = sortedAndFilteredProducts.reduce((sum, p) => sum + p.quantity, 0);
        const value = sortedAndFilteredProducts.reduce((sum, p) => sum + (p.purchasePrice * p.quantity), 0);

        return {
            totalProducts: sortedAndFilteredProducts.length,
            totalQuantity: quantity,
            totalValue: value
        };

    }, [sortedAndFilteredProducts]);


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
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3" />;
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
            "category": p.category || '',
            "purchasePrice": p.purchasePrice,
            "price": p.price,
            "quantity": p.quantity,
            "minStockLevel": p.minStockLevel,
            "barcodes": [...(p.barcodes || []), ...(p.barcode ? [p.barcode] : [])].join(','),
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
                        category: imported.category || '',
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
    
    const handleOpenPOCreation = () => {
        if (!products || selectedProductIds.length === 0) {
            toast.info("Veuillez sélectionner des produits à commander.");
            return;
        }
        const selected = products.filter(p => selectedProductIds.includes(p.id));
        setProductsForPO(selected);
        setIsCreatingPO(true);
    };

    const handleCreatePurchaseOrder = async (supplier: string, items: PurchaseOrderItem[]) => {
        if (!firestore || !user) {
            toast.error("Services non disponibles.");
            return Promise.reject(new Error("Firebase services not available"));
        }

        const totalValue = items.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0);
        const poRef = collection(firestore, 'users', user.uid, 'purchaseOrders');
        
        return new Promise<void>((resolve, reject) => {
            addDocumentNonBlocking(poRef, {
                poNumber: `BC-${Date.now()}`,
                supplier: supplier,
                items: items,
                totalValue: totalValue,
                status: 'pending',
                createdAt: serverTimestamp()
            }, {
                onSuccess: () => {
                    toast.success("Bon de commande créé avec succès.");
                    setSelectedProducts({});
                    setIsCreatingPO(false);
                    resolve();
                },
                onError: (err) => {
                    console.error("Failed to create PO:", err);
                    toast.error("Échec de la création du bon de commande.");
                    reject(err);
                }
            });
        });
    };
    
    const handleBulkDelete = async () => {
        if (!firestore || !user || selectedProductIds.length === 0) return;

        const batch = writeBatch(firestore);
        selectedProductIds.forEach(id => {
            const productDocRef = doc(firestore, 'users', user.uid, 'products', id);
            batch.delete(productDocRef);
        });

        try {
            await batch.commit();
            toast.success(`${selectedProductIds.length} produit(s) ont été supprimés.`);
            setSelectedProducts({});
            setIsBulkDeleting(false);
        } catch (err) {
            console.error("Failed to bulk delete products:", err);
            toast.error("Échec de la suppression des produits.");
            setIsBulkDeleting(false);
        }
    };

    const handleBulkUpdateCategory = async (newCategory: string) => {
        if (!firestore || !user || selectedProductIds.length === 0) return;

        const batch = writeBatch(firestore);
        selectedProductIds.forEach(id => {
            const productDocRef = doc(firestore, 'users', user.uid, 'products', id);
            batch.update(productDocRef, { category: newCategory });
        });

        try {
            await batch.commit();
            toast.success(`${selectedProductIds.length} produit(s) ont été mis à jour avec la catégorie "${newCategory}".`);
            setSelectedProducts({});
            setIsEditingCategory(false);
        } catch (err) {
            console.error("Failed to bulk update categories:", err);
            toast.error("Échec de la mise à jour des catégories.");
            setIsEditingCategory(false);
        }
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
                    product={editingProduct as ProductWithLegacyBarcode}
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
            {labelProduct && (
                <BarcodeLabelDialog
                    isOpen={!!labelProduct}
                    onOpenChange={() => setLabelProduct(null)}
                    product={labelProduct as ProductWithLegacyBarcode}
                />
            )}
             <ProductImportDialog
                isOpen={isImporting}
                onOpenChange={setIsImporting}
                onConfirm={handleImportCSV}
            />
             <BulkDeleteDialog
                isOpen={isBulkDeleting}
                onOpenChange={setIsBulkDeleting}
                onConfirm={handleBulkDelete}
                productCount={selectedProductIds.length}
            />
             <BulkEditCategoryDialog
                isOpen={isEditingCategory}
                onOpenChange={setIsEditingCategory}
                onConfirm={handleBulkUpdateCategory}
                productCount={selectedProductIds.length}
            />
            {adjustingStockProduct && (
                <AdjustStockDialog
                    isOpen={!!adjustingStockProduct}
                    onOpenChange={() => setAdjustingStockProduct(null)}
                    userId={user.uid}
                    product={adjustingStockProduct as ProductWithLegacyBarcode}
                />
            )}
            <CreatePoDialog
                isOpen={isCreatingPO}
                onOpenChange={setIsCreatingPO}
                products={productsForPO}
                onCreate={handleCreatePurchaseOrder}
            />
           
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Produits (filtrés)</CardTitle>
                            <Boxes className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                            <p className="text-xs text-muted-foreground">Nombre d'articles uniques</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Quantité totale en stock</CardTitle>
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalQuantity}</div>
                            <p className="text-xs text-muted-foreground">Somme des quantités en stock</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valeur totale du stock</CardTitle>
                            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalValue.toFixed(2)} DA</div>
                            <p className="text-xs text-muted-foreground">Valeur d'achat des produits affichés</p>
                        </CardContent>
                    </Card>
                </div>
                <Card className="w-full bg-card">
                    <CardHeader className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Rechercher par nom, catégorie..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full"
                                    />
                                </div>
                                <div className="hidden sm:flex gap-1 rounded-md bg-muted p-1">
                                    <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('table')}>
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                             <div className="flex gap-2 w-full sm:w-auto flex-wrap justify-start sm:justify-end">
                                {selectedProductIds.length > 0 && (
                                     <div className="flex gap-2 border-r pr-2 mr-2 flex-wrap">
                                         <Button variant="outline" onClick={handleOpenPOCreation}>
                                            <ShoppingCart className="mr-2 h-4 w-4" /> Créer BC ({selectedProductIds.length})
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsEditingCategory(true)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Changer catégorie
                                        </Button>
                                        <Button variant="destructive" onClick={() => setIsBulkDeleting(true)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                        </Button>
                                     </div>
                                )}
                                <Button asChild variant="outline">
                                    <Link href="/products/purchase-orders">
                                        <ListOrdered className="mr-2 h-4 w-4" /> Gérer les BC
                                    </Link>
                                </Button>
                               
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">
                                            Actions <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsImporting(true)}>
                                            <Upload className="mr-2 h-4 w-4" /> Importer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleExportToCSV}>
                                            <Download className="mr-2 h-4 w-4" /> Exporter
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button onClick={() => setIsAddingProduct(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
                                </Button>
                             </div>
                        </div>
                         {categories.length > 1 && (
                            <div>
                                <ScrollArea className="w-full whitespace-nowrap">
                                    <div className="flex items-center gap-2 pb-1">
                                        <span className="text-sm font-medium text-muted-foreground">Catégories:</span>
                                        {categories.map(category => (
                                            <Button
                                                key={category}
                                                variant={selectedCategory === category ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory(category)}
                                                className="capitalize"
                                            >
                                                {category === 'all' ? 'Toutes' : category}
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                         )}
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        {isLoading ? (
                            <div className="text-center">Chargement des données...</div>
                        ) : sortedAndFilteredProducts && sortedAndFilteredProducts.length > 0 ? (
                            viewMode === 'table' ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="px-4">
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
                                                <SortableHeader sortKey="category" className="text-left hidden md:table-cell">Catégorie</SortableHeader>
                                                <TableHead className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Codes-barres</TableHead>
                                                <SortableHeader sortKey="purchasePrice" className="text-right hidden sm:table-cell">Prix d'achat</SortableHeader>
                                                <SortableHeader sortKey="price" className="text-right">Prix de vente</SortableHeader>
                                                <SortableHeader sortKey="profitMargin" className="text-right hidden lg:table-cell">Marge Bénéfice</SortableHeader>
                                                <SortableHeader sortKey="quantity" className="text-right">Quantité</SortableHeader>
                                                <TableHead className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Stock Min.</TableHead>
                                                <TableHead className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Étiquette</TableHead>
                                                <TableHead className="relative px-4 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedAndFilteredProducts.map(product => (
                                                <TableRow key={product.id} data-state={selectedProducts[product.id] && 'selected'}>
                                                    <TableCell className="px-4">
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
                                                    <TableCell className="text-muted-foreground text-xs hidden md:table-cell">{product.category || '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs hidden lg:table-cell font-mono">
                                                        {[...(product.barcodes || []), ...(product.barcode ? [product.barcode] : [])].join(', ')}
                                                    </TableCell>
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
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" onClick={() => setLabelProduct(product)} title="Générer Étiquette">
                                                            <Barcode className="h-5 w-5" />
                                                        </Button>
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
                                                                <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    <span>Modifier</span>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => setAdjustingStockProduct(product)}>
                                                                    <Boxes className="mr-2 h-4 w-4" />
                                                                    <span>Ajuster le stock</span>
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
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
                                    {sortedAndFilteredProducts.map(product => (
                                        <Card key={product.id} className="flex flex-col overflow-hidden">
                                            <div className="relative">
                                                <div className="absolute top-2 left-2 z-10">
                                                    <Checkbox
                                                        checked={!!selectedProducts[product.id]}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedProducts(prev => ({...prev, [product.id]: !!checked}));
                                                        }}
                                                        className="h-5 w-5 bg-background border-border"
                                                    />
                                                </div>
                                                <div className="absolute top-2 right-2 z-10">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="secondary" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Ouvrir le menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                <span>Modifier</span>
                                                            </DropdownMenuItem>
                                                             <DropdownMenuItem onClick={() => setAdjustingStockProduct(product)}>
                                                                <Boxes className="mr-2 h-4 w-4" />
                                                                <span>Ajuster le stock</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setLabelProduct(product)}>
                                                                <Barcode className="mr-2 h-4 w-4" />
                                                                <span>Générer Étiquette</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setDeletingProduct(product)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Supprimer</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="relative w-full h-32 bg-muted">
                                                    {product.imageUrl ? (
                                                        <Image src={product.imageUrl} alt={product.name} fill style={{objectFit: 'cover'}} />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full w-full">
                                                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <CardContent className="p-3 flex-grow flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                                                    <p className="text-xs text-muted-foreground">{product.category || 'Sans catégorie'}</p>
                                                </div>
                                                <div className="mt-2 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Prix de vente:</span>
                                                        <span className="font-bold text-primary">{product.price.toFixed(2)} DA</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span>Prix d'achat:</span>
                                                        <span>{product.purchasePrice.toFixed(2)} DA</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Quantité:</span>
                                                        <span className={cn("font-bold", product.quantity <= product.minStockLevel && product.quantity > 0 && 'text-yellow-500', product.quantity === 0 && 'text-destructive')}>
                                                            {product.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span>Marge:</span>
                                                        <span className={cn("font-bold", getProfitMarginColor(product.profitMargin || 0))}>
                                                            {product.profitMargin !== undefined ? `${product.profitMargin.toFixed(1)}%` : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )
                        ) : products && products.length > 0 && (searchQuery || selectedCategory !== 'all') ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border">
                                <p className="text-muted-foreground">Aucun produit ne correspond à vos filtres.</p>
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

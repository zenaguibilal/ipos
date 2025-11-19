
'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, writeBatch, query, collectionGroup } from 'firebase/firestore';
import type { Product, Supplier } from '@/lib/types';
import { useProducts, useSuppliers } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader, PlusCircle, Trash2, Edit, AlertCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

function ProductForm({ 
    isOpen, 
    onClose, 
    onSave,
    product,
    suppliers 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (product: Omit<Product, 'id'>, id?: string) => Promise<void>,
    product: Product | null,
    suppliers: Supplier[]
}) {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        const productData: Omit<Product, 'id'> = {
            name: formData.get('name') as string,
            price: Number(formData.get('price')) * 100,
            purchasePrice: Number(formData.get('purchasePrice')) * 100,
            quantity: Number(formData.get('quantity')),
            minStock: Number(formData.get('minStock')),
            supplierId: formData.get('supplierId') as string,
            description: formData.get('description') as string,
            imageUrl: formData.get('imageUrl') as string,
            barcode: formData.get('barcode') as string,
        };
        
        await onSave(productData, product?.id);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{product ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</DialogTitle>
                    <DialogDescription>
                        {product ? "Modifiez les détails du produit." : "Entrez les détails du nouveau produit."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="product-form" className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" name="name" defaultValue={product?.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Prix de vente</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={product ? product.price / 100 : ''} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="purchasePrice" className="text-right">Prix d'achat</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={product ? product.purchasePrice / 100 : ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">Quantité</Label>
                        <Input id="quantity" name="quantity" type="number" defaultValue={product?.quantity} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minStock" className="text-right">Stock min.</Label>
                        <Input id="minStock" name="minStock" type="number" defaultValue={product?.minStock} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supplierId" className="text-right">Fournisseur</Label>
                        <Select name="supplierId" defaultValue={product?.supplierId} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Choisir un fournisseur" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="barcode" className="text-right">Code-barres</Label>
                        <Input id="barcode" name="barcode" defaultValue={product?.barcode} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="imageUrl" className="text-right">URL Image</Label>
                        <Input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea id="description" name="description" defaultValue={product?.description} className="col-span-3" />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
                    <Button type="submit" form="product-form" disabled={isSaving}>
                        {isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ProductsPage() {
    const firestore = useFirestore();
    const { products, isLoading: productsLoading } = useProducts();
    const { suppliers, isLoading: suppliersLoading } = useSuppliers();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const handleSaveProduct = async (productData: Omit<Product, 'id'>, id?: string) => {
        if (!firestore) return;
        try {
            if (id) { // Editing existing product
                const productRef = doc(firestore, `suppliers/${productData.supplierId}/products`, id);
                await updateDoc(productRef, productData);
                toast({ title: "Produit mis à jour" });
            } else { // Adding new product
                const productsColRef = collection(firestore, `suppliers/${productData.supplierId}/products`);
                await addDoc(productsColRef, productData);
                toast({ title: "Produit ajouté" });
            }
            setIsFormOpen(false);
            setSelectedProduct(null);
        } catch (error) {
            console.error("Error saving product:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le produit." });
        }
    };
    
    const handleDeleteProduct = async () => {
        if (!firestore || !productToDelete) return;
        try {
            const productRef = doc(firestore, `suppliers/${productToDelete.supplierId}/products`, productToDelete.id);
            await deleteDoc(productRef);
            toast({ title: "Produit supprimé" });
            setProductToDelete(null);
        } catch (error) {
            console.error("Error deleting product:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le produit." });
        }
    };
    
    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedProduct(null);
        setIsFormOpen(true);
    };

    const isLoading = productsLoading || suppliersLoading;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="grid gap-2">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Package/> Produits</h1>
                    <p className="text-muted-foreground">Gérez votre inventaire de produits.</p>
                </div>
                 <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un produit
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-60">
                            <Loader className="animate-spin h-8 w-8 text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Fournisseur</TableHead>
                                    <TableHead className="text-right">Prix</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Quantité</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map(product => (
                                    <TableRow key={product.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image
                                                alt={product.name}
                                                className="aspect-square rounded-md object-cover"
                                                height="64"
                                                src={product.imageUrl || `https://picsum.photos/seed/${product.id}/64/64`}
                                                width="64"
                                                data-ai-hint="product photo"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{supplierMap.get(product.supplierId) || 'Inconnu'}</TableCell>
                                        <TableCell className="text-right">{(product.price / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}</TableCell>
                                        <TableCell className="hidden md:table-cell text-right">{product.quantity}</TableCell>
                                        <TableCell>
                                            {product.quantity <= 0 ? (
                                                <Badge variant="destructive">Rupture</Badge>
                                            ) : product.quantity <= product.minStock ? (
                                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Stock Faible</Badge>
                                            ) : (
                                                <Badge variant="secondary">En Stock</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setProductToDelete(product)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Supprimer</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            {isFormOpen && (
                <ProductForm 
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setSelectedProduct(null); }}
                    onSave={handleSaveProduct}
                    product={selectedProduct}
                    suppliers={suppliers}
                />
            )}

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement le produit &quot;{productToDelete?.name}&quot;. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProduct}>Oui, supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

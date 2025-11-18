'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

function ProductForm({ product, onSave, onCancel }: { product: Partial<Product> | null, onSave: (p: Product) => void, onCancel: () => void }) {
    // A real implementation would use a robust form library like react-hook-form
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newProduct: Product = {
            id: product?.id || `prod_${Date.now()}`,
            name: formData.get('name') as string,
            price: parseFloat(formData.get('price') as string) * 100,
            stock: parseInt(formData.get('stock') as string, 10),
            salesVelocity: product?.salesVelocity || 0,
            reorderThreshold: parseInt(formData.get('reorderThreshold') as string, 10),
            imageUrl: product?.imageUrl || 'https://picsum.photos/seed/99/400/400',
            imageHint: product?.imageHint || 'product placeholder',
        };
        onSave(newProduct);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader className="p-6">
                <SheetTitle>{product?.id ? 'Edit Product' : 'Add Product'}</SheetTitle>
                <SheetDescription>
                    Fill in the details for the product. Click save when you're done.
                </SheetDescription>
            </SheetHeader>
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" name="name" defaultValue={product?.name} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price ? product.price / 100 : ''} required />
                    </div>
                    <div>
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" name="stock" type="number" defaultValue={product?.stock} required />
                    </div>
                </div>
                <div>
                    <Label htmlFor="reorderThreshold">Reorder Threshold</Label>
                    <Input id="reorderThreshold" name="reorderThreshold" type="number" defaultValue={product?.reorderThreshold} required />
                </div>
            </div>
            <SheetFooter className="p-6 bg-muted/40 border-t">
                <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Product</Button>
            </SheetFooter>
        </form>
    );
}

export function ProductList({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

    const handleAddClick = () => {
        setEditingProduct(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setIsSheetOpen(true);
    };

    const handleDelete = (productId: string) => {
        setProducts(products.filter(p => p.id !== productId));
    };

    const handleSave = (product: Product) => {
        if (editingProduct?.id) {
            setProducts(products.map(p => p.id === product.id ? product : p));
        } else {
            setProducts([product, ...products]);
        }
        setIsSheetOpen(false);
        setEditingProduct(null);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Products</CardTitle>
                        <CardDescription>Manage your products and view their inventory status.</CardDescription>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Product</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Price</TableHead>
                                <TableHead className="hidden md:table-cell">Stock</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="hidden sm:table-cell">
                                        <Image
                                            alt={product.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={product.imageUrl}
                                            width="64"
                                            data-ai-hint={product.imageHint}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>
                                        {product.stock > product.reorderThreshold ? <Badge variant="outline">In Stock</Badge> : (product.stock > 0 ? <Badge variant="destructive">Low Stock</Badge> : <Badge variant="destructive">Out of Stock</Badge>)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {(product.price / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{product.stock}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEditClick(product)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg p-0">
                   <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setIsSheetOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}

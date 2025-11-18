'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

function ProductForm({
  product,
  onSave,
  onCancel,
  supplierId,
}: {
  product: Partial<Product> | null;
  onSave: (p: Product) => void;
  onCancel: () => void;
  supplierId: string;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: product?.id || `prod_${Date.now()}`,
      name: formData.get('name') as string,
      price: parseFloat(formData.get('sellingPrice') as string) * 100,
      purchasePrice: parseFloat(formData.get('purchasePrice') as string) * 100,
      quantity: parseInt(formData.get('stock') as string, 10),
      minStock: parseInt(formData.get('minStock') as string, 10),
      imageUrl: product?.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`,
      description: product?.description || '',
      supplierId: supplierId,
      barcode: formData.get('barcode') as string,
    };
    onSave(newProduct);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <SheetHeader className="p-6">
        <SheetTitle>
          {product?.id ? 'Modifier le Produit' : 'Ajouter un Produit'}
        </SheetTitle>
        <SheetDescription>
          Remplissez les détails du produit. Cliquez sur enregistrer lorsque vous
          avez terminé.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-grow p-6 space-y-4 overflow-y-auto">
        <div>
          <Label htmlFor="name">Nom du Produit</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div>
          <Label htmlFor="barcode">Code-barres</Label>
          <Input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="purchasePrice">Prix d'achat (DZD)</Label>
                <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    step="0.01"
                    defaultValue={product?.purchasePrice ? product.purchasePrice / 100 : ''}
                />
            </div>
            <div>
                <Label htmlFor="sellingPrice">Prix de vente (DZD)</Label>
                <Input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    defaultValue={product?.price ? product.price / 100 : ''}
                    required
                />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              defaultValue={product?.quantity}
              required
            />
          </div>
          <div>
            <Label htmlFor="minStock">أدنى مخزون</Label>
            <Input
              id="minStock"
              name="minStock"
              type="number"
              defaultValue={product?.minStock}
            />
          </div>
        </div>
      </div>
      <SheetFooter className="p-6 bg-muted/40 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">Enregistrer le Produit</Button>
      </SheetFooter>
    </form>
  );
}

export function ProductList({ initialProducts }: { initialProducts: Product[] }) {
  const firestore = useFirestore();
  const supplierId = 'supp_1';
  const productsRef = useMemoFirebase(
    () => collection(firestore, `suppliers/${supplierId}/products`),
    [firestore, supplierId]
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleDelete = (productId: string) => {
    const docRef = doc(productsRef, productId);
    deleteDocumentNonBlocking(docRef);
  };

  const handleSave = (product: Product) => {
    const { id, ...productData } = product;
    const docRef = doc(productsRef, id);
    setDocumentNonBlocking(docRef, productData, { merge: true });

    setIsSheetOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = initialProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="grid gap-2">
                <CardTitle>Produits</CardTitle>
                <CardDescription>
                Gérez vos produits et consultez l'état de leur inventaire.
                </CardDescription>
            </div>
            <Button
                size="sm"
                className="h-8 gap-1"
                onClick={handleAddClick}
            >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Ajouter un Produit
                </span>
            </Button>
          </div>
           <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Rechercher par nom ou code-barres..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  Image
                </TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Code-barres</TableHead>
                <TableHead>Prix d'achat</TableHead>
                <TableHead>Prix de vente</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>أدنى مخزون</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={
                        product.imageUrl ||
                        `https://picsum.photos/seed/${product.id}/64/64`
                      }
                      width="64"
                      data-ai-hint={'product photo'}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                   <TableCell>
                    {(product.purchasePrice / 100).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'DZD',
                      minimumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell>
                    {(product.price / 100).toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'DZD',
                      minimumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.minStock}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ouvrir/fermer le menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(product)}
                        >
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          Supprimer
                        </DropdownMenuItem>
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
          <SheetTitle className="sr-only">
            {editingProduct ? 'Modifier le Produit' : 'Ajouter un Produit'}
          </SheetTitle>
          <ProductForm
            product={editingProduct}
            onSave={handleSave}
            onCancel={() => setIsSheetOpen(false)}
            supplierId={supplierId}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

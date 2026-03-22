'use client';

import React, { useState, useMemo, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { dataService } from '@/services/data-service';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Barcode, PackagePlus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductSearchProps {
    onProductSelect: (product: Product, quantity: number) => void;
}

const CustomProductDialog = ({ onAdd }: { onAdd: (name: string, price: number) => void }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
  
    const handleAdd = () => {
      if (name && price) {
        onAdd(name, parseFloat(price));
        setOpen(false);
        setName('');
        setPrice('');
      }
    };
  
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
            <PackagePlus className="mr-2 h-4 w-4" /> Ajouter un produit personnalisé
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un produit personnalisé</DialogTitle>
              <DialogDescription>
                Créez un article temporaire qui ne sera pas sauvegardé dans votre inventaire.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Nom du produit</Label>
                <Input id="custom-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-price">Prix</Label>
                <Input id="custom-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleAdd}>Ajouter au panier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
};

export const ProductSearch = forwardRef<{focus: () => void}, ProductSearchProps>(({ onProductSelect }, ref) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 100);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const inputRef = useRef<HTMLInputElement>(null);
    
    const categories = useLiveQuery(() => dataService.getProductCategories(), []);

    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
        },
    }));
    
    const filteredProducts = useLiveQuery(async () => {
        if (!debouncedQuery) return [];
        return dataService.getProducts({ query: debouncedQuery, category: selectedCategory === 'all' ? undefined : selectedCategory });
    }, [debouncedQuery, selectedCategory]);

    const handleBarcodeScanned = async (scannedBarcode: string) => {
        if (!scannedBarcode.trim()) return;
        const product = await dataService.getProductByBarcode(scannedBarcode.trim());
        if (product) {
            onProductSelect(product, 1);
            setQuery(''); // Clear query after successful scan
        } else {
            toast.error("Produit non trouvé pour ce code-barres.");
        }
    };
    
    const addCustomProduct = (name: string, price: number) => {
        const customProduct: Product = {
            id: `custom-${Date.now()}`,
            name: `(Perso) ${name}`,
            price,
            purchasePrice: price, // Assume purchase price is same as selling for custom items
            quantity: 1, // Represents one-time item
            minStockLevel: 0,
            category: 'Personnalisé'
        };
        onProductSelect(customProduct, 1);
    };

    return (
        <div className="p-4 flex flex-col h-full bg-transparent">
            <div className="relative mb-4">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    ref={inputRef}
                    placeholder="Scanner un code-barres ou rechercher..."
                    className="pl-10 h-12 text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBarcodeScanned(e.currentTarget.value);
                        }
                    }}
                    autoFocus
                />
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap -mx-2 px-2">
                <div className="flex space-x-2 pb-2">
                    <Button 
                        variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                        className="rounded-full"
                    >
                        Toutes
                    </Button>
                    {categories?.map(cat => (
                        <Button 
                            key={cat}
                            variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedCategory(cat)}
                            className="rounded-full"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <ScrollArea className="flex-grow -mx-4 mt-2">
                <div className="space-y-1 px-4">
                    {filteredProducts?.map((product, index) => (
                        <ListItem
                            key={product.id}
                            product={product}
                            onClick={() => {
                                onProductSelect(product, 1);
                                setQuery(''); // Clear search after selection
                            }}
                            isLast={index === filteredProducts.length - 1}
                        />
                    ))}
                     {filteredProducts?.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            {query.trim() ? (
                                <p>Aucun produit trouvé pour votre recherche.</p>
                            ) : (
                                <p>Commencez à taper pour rechercher des produits.</p>
                            )}
                        </div>
                     )}
                </div>
            </ScrollArea>
             <div className="mt-4 flex-shrink-0">
                <CustomProductDialog onAdd={addCustomProduct} />
            </div>
        </div>
    );
});
ProductSearch.displayName = 'ProductSearch';

interface ListItemProps {
    product: Product;
    onClick: () => void;
    isLast: boolean;
}

const ListItem = React.memo(({ product, onClick, isLast }: ListItemProps) => {
    const isAvailable = typeof product.id === 'string' || product.quantity > 0;
    const placeholder = getPlaceholder(product.category);

    return (
        <button 
            onClick={onClick}
            disabled={!isAvailable}
            className={cn(
                "w-full text-left flex items-center gap-4 p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                !isLast && "border-b border-white/5"
            )}
        >
            <Image
                src={product.imageUrl || placeholder.url}
                alt={product.name}
                width={40}
                height={40}
                className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                unoptimized
            />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
            </div>
            <div className="text-sm text-muted-foreground flex-shrink-0">
                Stock: {product.quantity}
            </div>
        </button>
    );
});
ListItem.displayName = "ListItem";

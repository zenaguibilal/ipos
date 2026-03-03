'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Barcode, PackagePlus } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductSearchProps {
    onProductSelect: (product: Product, quantity: number) => void;
}

type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;
const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) return placeholders[category];
    return placeholders.default;
};

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

export function ProductSearch({ onProductSelect }: ProductSearchProps) {
    const [query, setQuery] = useState('');
    
    const products = useLiveQuery(() => db.products.toArray(), []);

    const handleBarcodeScanned = useCallback((scannedBarcode: string) => {
        if (!products || !scannedBarcode.trim()) return;
        const product = products.find(p => p.barcodes?.includes(scannedBarcode.trim()));
        if (product) {
            onProductSelect(product, 1);
            setQuery(''); // Clear query after successful scan
        }
    }, [products, onProductSelect]);
    
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const lowercasedQuery = query.toLowerCase().trim();
        if (!lowercasedQuery) return products.slice(0, 50); // Show first 50 products if no query
        
        return products.filter(p => 
            p.name.toLowerCase().includes(lowercasedQuery) ||
            p.barcodes?.some(b => b.includes(lowercasedQuery))
        );
    }, [query, products]);

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
                    placeholder="Scanner un code-barres ou rechercher..."
                    className="pl-10 h-12 text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleBarcodeScanned(e.currentTarget.value);
                        }
                    }}
                    autoFocus
                />
            </div>
            
            <ScrollArea className="flex-grow -mx-4">
                <div className="space-y-1 px-4">
                    {filteredProducts.map((product, index) => (
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
                     {query && filteredProducts.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Aucun produit trouvé pour "{query}".</p>
                        </div>
                     )}
                </div>
            </ScrollArea>
             <div className="mt-4 flex-shrink-0">
                <CustomProductDialog onAdd={addCustomProduct} />
            </div>
        </div>
    );
}

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

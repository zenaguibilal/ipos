'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Barcode, PackagePlus } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '../ui/label';

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
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name">Nom du produit</Label>
                <Input id="custom-name" value={name} onChange={(e) => setName(e.target.value)} />
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
        if (!products) return;
        const product = products.find(p => p.barcodes?.includes(scannedBarcode.trim()));
        if (product) {
            onProductSelect(product, 1);
            setQuery(''); // Clear query after successful scan
        }
    }, [products, onProductSelect]);
    
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const lowercasedQuery = query.toLowerCase();
        if (!lowercasedQuery) return products;
        
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
        <div className="p-4 flex flex-col h-full">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher par nom ou scanner un code-barres..."
                    className="pl-9"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleBarcodeScanned(e.currentTarget.value);
                        }
                    }}
                />
            </div>
            
            <ScrollArea className="flex-grow">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts?.map(product => (
                        <Card
                            key={product.id}
                            product={product}
                            onClick={() => onProductSelect(product, 1)}
                        />
                    ))}
                </div>
            </ScrollArea>
             <div className="mt-4 flex-shrink-0">
                <CustomProductDialog onAdd={addCustomProduct} />
            </div>
        </div>
    );
}


interface CardProps {
    product: Product;
    onClick: () => void;
}

const Card = React.memo(({ product, onClick }: CardProps) => {
    const isAvailable = product.quantity > 0;
    const placeholder = getPlaceholder(product.category);

    return (
        <button 
            onClick={onClick}
            disabled={!isAvailable}
            className="relative group border rounded-lg text-left overflow-hidden transition-transform duration-150 ease-in-out active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Image
                src={product.imageUrl || placeholder.url}
                alt={product.name}
                width={placeholder.width}
                height={placeholder.height}
                className="w-full h-24 object-cover"
                unoptimized
            />
            {!isAvailable && (
                <div className="absolute inset-0 bg-stone-700/60 flex items-center justify-center">
                    <p className="text-white font-bold text-sm">Épuisé</p>
                </div>
            )}
             <div className="p-2">
                <p className="text-sm font-semibold truncate group-hover:text-primary">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.price.toFixed(1)} DA</p>
            </div>
        </button>
    );
});
Card.displayName = "Card";


'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '@/lib/types';
import { PlusCircle, ScanLine } from 'lucide-react';
import Image from 'next/image';

interface ProductWithOptionalBarcode extends Product {
    barcode?: string;
}

interface ProductGridProps {
    products: ProductWithOptionalBarcode[];
    onAddToCart: (product: ProductWithOptionalBarcode) => void;
    onAddNewProduct: () => void;
    onAddCustomProduct: () => void;
}

export function ProductGrid({ products, onAddToCart, onAddNewProduct, onAddCustomProduct }: ProductGridProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const productsByBarcode = useMemo(() => {
        if (!products) return {};
        return products.reduce((acc, product) => {
            if (product.barcodes && product.barcodes.length > 0) {
                 product.barcodes.forEach(barcode => {
                    acc[barcode] = product;
                });
            }
            if (product.barcode) { // Handle old single barcode
                acc[product.barcode] = product;
            }
            return acc;
        }, {} as Record<string, ProductWithOptionalBarcode>);
    }, [products]);

    const filteredProducts = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        if (!lowercasedQuery) return products;
        
        return products.filter(product => 
            product.name.toLowerCase().includes(lowercasedQuery) ||
            (product.barcodes && product.barcodes.some(b => b.toLowerCase().includes(lowercasedQuery))) ||
            (product.barcode && product.barcode.toLowerCase().includes(lowercasedQuery))
        );
    }, [products, searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productFromBarcode = productsByBarcode[searchQuery];
        if (productFromBarcode) {
            onAddToCart(productFromBarcode);
            setSearchQuery('');
        } else if (filteredProducts.length === 1) {
            // If only one product matches the text search, add it
            onAddToCart(filteredProducts[0]);
            setSearchQuery('');
        }
    };
    
    // Focus on search input on F2 key press
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'F2') {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-2">
                <form onSubmit={handleSearchSubmit} className="flex-grow">
                    <div className="relative">
                        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            id="search-product"
                            placeholder="Scanner ou rechercher un produit... (F2)"
                            className="pl-10 text-base h-12"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </form>
                <div className="flex gap-2 flex-shrink-0">
                     <Button variant="outline" onClick={onAddCustomProduct} className="h-12 flex-1 sm:flex-auto">
                        Produit Personnalisé (Alt+A)
                    </Button>
                    <Button variant="outline" onClick={onAddNewProduct} className="h-12 flex-1 sm:flex-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Nouveau (Alt+N)
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                    {filteredProducts.map(product => (
                        <Card 
                            key={product.id} 
                            onClick={() => onAddToCart(product)}
                            className="cursor-pointer hover:shadow-lg hover:border-primary transition-all group"
                        >
                            <CardContent className="p-0 flex flex-col items-center text-center">
                                <div className="relative w-full h-24 bg-muted overflow-hidden rounded-t-lg">
                                     <Image
                                        src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200/200`}
                                        alt={product.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="group-hover:scale-105 transition-transform"
                                        data-ai-hint="product image"
                                    />
                                     {product.quantity <= product.minStockLevel && (
                                        <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                            Stock Faible
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 flex flex-col flex-grow w-full">
                                    <p className="font-semibold text-sm flex-grow line-clamp-2">{product.name}</p>
                                    <p className="font-bold text-primary mt-1">{product.price.toFixed(2)} DA</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                     {filteredProducts.length === 0 && searchQuery && (
                         <div className="col-span-full text-center py-10">
                            <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche.</p>
                        </div>
                     )}
                </div>
            </div>
        </>
    );
}

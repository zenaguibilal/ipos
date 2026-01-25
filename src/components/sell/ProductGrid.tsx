'use client';
import { useState, useMemo } from 'react';
import type { Product, CartItem } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, PenSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProductGridCard } from './ProductGridCard';
import { ProductCardSkeleton } from '../products/product-card-skeleton';
import { toast } from 'sonner';

interface ProductGridProps {
    allProducts: Product[];
    topProducts: Product[];
    cartItems: CartItem[];
    isLoading: boolean;
    onProductSelect: (product: Product) => void;
    onAddCustomProduct: () => void;
    onAddNewProduct: () => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

export function ProductGrid({ allProducts, topProducts, cartItems, isLoading, onProductSelect, onAddCustomProduct, onAddNewProduct, searchQuery, onSearchQueryChange }: ProductGridProps) {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = useMemo(() => {
        if (!allProducts) return [];
        const allCategories = allProducts.map(p => p.category).filter(Boolean) as string[];
        return ['all', ...Array.from(new Set(allCategories))];
    }, [allProducts]);

    const productsToDisplay = useMemo(() => {
        let results: Product[];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            results = (allProducts || []).filter(p =>
                p.name.toLowerCase().includes(lowercasedQuery) ||
                p.barcodes?.some(b => b.includes(lowercasedQuery))
            );
        } else {
            results = topProducts || [];
        }

        if (selectedCategory !== 'all') {
            return results.filter(p => p.category === selectedCategory);
        }
        
        return results;
    }, [allProducts, topProducts, searchQuery, selectedCategory]);

    const cartItemIds = useMemo(() => new Set(cartItems.map(item => item.id)), [cartItems]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (productsToDisplay.length === 1) {
                const product = productsToDisplay[0];
                if (product.quantity > 0) {
                    onProductSelect(product);
                    onSearchQueryChange(''); // Clear search after adding
                } else {
                    toast.error(`${product.name} est en rupture de stock.`);
                }
            } else if (productsToDisplay.length > 1) {
                toast.info("Plusieurs produits correspondent. Veuillez affiner votre recherche.");
            } else {
                toast.error("Aucun produit trouvé pour cette recherche.");
            }
        }
    };

    return (
        <div className="md:col-span-2 xl:col-span-3 flex flex-col p-4 bg-muted/30 h-full">
            <header className="flex-shrink-0 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Scanner ou rechercher un produit..."
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-9 h-11 text-base"
                        />
                    </div>
                    <Button variant="outline" className="h-11" onClick={onAddCustomProduct}>
                        <PenSquare className="mr-2 h-4 w-4" /> Produit Personnalisé <span className="text-muted-foreground ml-2 text-xs">(Alt+A)</span>
                    </Button>
                    <Button variant="outline" className="h-11" onClick={onAddNewProduct}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Nouveau <span className="text-muted-foreground ml-2 text-xs">(Alt+N)</span>
                    </Button>
                </div>
                <ScrollArea className="w-full mt-4">
                    <div className="flex gap-2 pb-2">
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={selectedCategory === cat ? 'default' : 'outline'}
                                onClick={() => setSelectedCategory(cat)}
                                className="capitalize flex-shrink-0"
                            >
                                {cat === 'all' ? 'Tous' : cat}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </header>
            <ScrollArea className="flex-grow -mx-4">
                <div className="px-4">
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 18 }).map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : productsToDisplay.length === 0 ? (
                        <div className="flex h-60 items-center justify-center">
                            <p className="text-muted-foreground">Aucun produit trouvé.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {productsToDisplay.map(product => (
                                <ProductGridCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => onProductSelect(product)}
                                    isInCart={cartItemIds.has(product.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

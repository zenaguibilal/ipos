
'use client';

import React, { useState, useMemo, forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Barcode, PackagePlus, Search, ArrowRight, Star, Tag } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '../ui/label';
import { formatCurrency, getPlaceholder, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api-client';
import { useAppStore } from '@/stores/appStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '../ui/badge';

interface ProductSearchProps {
    onProductSelect: (product: Product, quantity: number) => void;
}

const CustomProductDialog = ({ isOpen, onOpenChange, onAdd }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onAdd: (name: string, price: number) => void }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
  
    const handleAdd = () => {
      if (name && price) {
        onAdd(name, parseFloat(price));
        setName('');
        setPrice('');
      }
    };

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setPrice('');
        }
    }, [isOpen]);
  
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="luxury-glass border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-primary" />
                Article Temporaire (Volant)
              </DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold opacity-60">
                Créez un article ponctuel sans l'enregistrer dans l'inventaire permanent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Désignation du produit</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="h-14 rounded-2xl bg-background/40 border-white/5 font-bold" placeholder="Ex: Service Minute, Remballage..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Prix de vente (DA)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="h-14 rounded-2xl bg-background/40 border-white/5 font-black text-2xl text-primary" placeholder="0.00" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Annuler</Button>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Ajouter au Panier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    );
};

export const ProductSearch = forwardRef<{focus: () => void, openCustomProductDialog: () => void}, ProductSearchProps>(({ onProductSelect }, ref) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 100);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const inputRef = useRef<HTMLInputElement>(null);
    
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const selectedItemRef = useRef<HTMLButtonElement>(null);
    
    const { carts, activeCartId } = useAppStore();
    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);
    
    const [categories, setCategories] = useState<string[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    
    const [isCustomProductDialogOpen, setIsCustomProductDialogOpen] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            const cats = await api.get<string[]>('products/categories');
            setCategories(cats);
        } catch (e) { toast.error("Impossible de charger les catégories.")}
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            const queryParams = new URLSearchParams({
                query: debouncedQuery,
                category: selectedCategory,
                stockStatus: 'in_stock'
            }).toString();
            const prods = await api.get<Product[]>(`products?${queryParams}`);
            setProducts(prods);
        } catch (e) { toast.error("Impossible de charger les produits.")}
    }, [debouncedQuery, selectedCategory]);


    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [products]);

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    const cartQuantities = useMemo(() => {
        const map = new Map<string, number>();
        if (activeCart) {
            activeCart.items.forEach(item => {
                map.set(item.uuid, item.cartQuantity);
            });
        }
        return map;
    }, [activeCart]);


    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current?.focus();
            inputRef.current?.select();
        },
        openCustomProductDialog: () => setIsCustomProductDialogOpen(true),
    }));

    const handleSelectProduct = useCallback((product: Product) => {
        const inCartQuantity = cartQuantities.get(product.uuid) || 0;
        const availableQuantity = product.quantity - inCartQuantity;
        if (availableQuantity > 0) {
            onProductSelect(product, 1);
            setQuery('');
            setSelectedIndex(-1);
            inputRef.current?.focus();
        } else {
            toast.warning(`Stock insuffisant pour ${product.name}.`);
        }
    }, [cartQuantities, onProductSelect]);


    const handleBarcodeScanned = async (scannedBarcode: string) => {
        if (!scannedBarcode.trim()) return;
        try {
            const product = await api.get<Product | null>(`products/barcode?q=${scannedBarcode.trim()}`);
            if (product) {
                handleSelectProduct(product);
            } else {
                toast.error("Code-barres inconnu.");
            }
        } catch (error) {
            toast.error("Erreur de recherche.");
        }
    };
    
    const addCustomProduct = (name: string, price: number) => {
        const customProduct: Product = {
            uuid: `custom-${Date.now()}`,
            name: `(Perso) ${name}`,
            price,
            purchasePrice: price,
            quantity: Infinity,
            minStockLevel: 0,
            category: 'Personnalisé',
            user_id: 'custom',
            barcodes: [],
            stockStatus: 'in_stock',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        onProductSelect(customProduct, 1);
        setIsCustomProductDialogOpen(false);
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (products.length > 0) {
                setSelectedIndex(prev => Math.min(prev + 1, products.length - 1));
            }
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (products.length > 0) {
                setSelectedIndex(prev => Math.max(prev - 1, -1));
            }
            return;
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < products.length) {
                handleSelectProduct(products[selectedIndex]);
            } else if (products?.length === 1 && query.trim()) {
                handleSelectProduct(products[0]);
            } else {
                handleBarcodeScanned(query);
            }
        }
    }, [products, selectedIndex, handleSelectProduct, query]);

    return (
        <div className="p-6 flex flex-col h-full bg-transparent">
            <div className="space-y-6 flex-shrink-0">
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        ref={inputRef}
                        placeholder="Scanner ou rechercher... (F1)"
                        className="pl-12 h-14 rounded-2xl bg-background/40 border-white/5 focus:border-primary/40 focus:ring-0 font-bold text-lg relative z-10 transition-all shadow-inner"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                </div>
                
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-primary opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rayons & Catégories</span>
                    </div>
                    <ScrollArea className="w-full whitespace-nowrap -mx-2 px-2">
                        <div className="flex space-x-2 pb-3">
                            <Button 
                                variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setSelectedCategory('all')}
                                className={cn("rounded-xl h-9 px-5 uppercase font-black text-[10px] tracking-widest transition-all", selectedCategory === 'all' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/10")}
                            >
                                Tout le stock
                            </Button>
                            {categories?.map(cat => (
                                <Button 
                                    key={cat}
                                    variant={selectedCategory === cat ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn("rounded-xl h-9 px-5 uppercase font-black text-[10px] tracking-widest transition-all", selectedCategory === cat ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/10 border border-white/5 bg-white/5")}
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>

            <Separator className="my-4 bg-white/5" />

            <ScrollArea className="flex-grow -mx-4 mt-2">
                <div className="space-y-2 px-4 pb-10">
                    {products?.length > 0 ? products.map((product, index) => {
                        const inCartQuantity = cartQuantities.get(product.uuid) || 0;
                        const availableQuantity = product.quantity - inCartQuantity;
                        return (
                            <ListItem
                                key={product.uuid}
                                ref={index === selectedIndex ? selectedItemRef : null}
                                product={product}
                                availableQuantity={availableQuantity}
                                onClick={() => handleSelectProduct(product)}
                                isSelected={index === selectedIndex}
                            />
                        )
                    }) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30 grayscale">
                            <Barcode className="h-16 w-16" />
                            <div className="space-y-1">
                                <p className="font-black uppercase text-xs tracking-widest">En attente de saisie</p>
                                <p className="text-[10px] italic">Scanner un article ou tapez son nom</p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

             <div className="mt-4 pt-4 border-t border-white/5 flex-shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsCustomProductDialogOpen(true)} 
                                className="w-full h-12 rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                <PackagePlus className="h-4 w-4" /> 
                                Produit Hors-Stock (F10)
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="luxury-glass">
                            <p className="text-[10px] font-bold">Ajouter un article non référencé</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <CustomProductDialog 
                    isOpen={isCustomProductDialogOpen} 
                    onOpenChange={setIsCustomProductDialogOpen} 
                    onAdd={addCustomProduct} 
                />
            </div>
        </div>
    );
});
ProductSearch.displayName = 'ProductSearch';

interface ListItemProps {
    product: Product;
    availableQuantity: number;
    onClick: () => void;
    isSelected: boolean;
}

const ListItem = React.memo(React.forwardRef<HTMLButtonElement, ListItemProps>(({ product, availableQuantity, onClick, isSelected }, ref) => {
    const isAvailable = availableQuantity > 0;
    const placeholder = getPlaceholder(product.category);

    return (
        <button 
            ref={ref}
            onClick={onClick}
            disabled={!isAvailable}
            className={cn(
                "w-full text-left flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group/item relative overflow-hidden",
                isSelected ? "bg-primary/20 ring-2 ring-primary shadow-2xl scale-[1.02] z-10" : "hover:bg-white/5 border border-white/5",
                !isAvailable && "opacity-40 grayscale"
            )}
        >
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted relative shrink-0">
                <Image
                    src={product.imageUrl || placeholder.url}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover/item:scale-110 duration-500"
                    unoptimized
                />
            </div>
            
            <div className="flex-grow overflow-hidden space-y-0.5">
                <p className="font-bold truncate text-sm uppercase tracking-tight">{product.name}</p>
                <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-primary tracking-widest">{formatCurrency(product.price)}</p>
                    <span className="h-1 w-1 rounded-full bg-white/10" />
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Stock: {availableQuantity === Infinity ? '∞' : availableQuantity} {product.unite}</p>
                </div>
            </div>

            <div className={cn(
                "flex-shrink-0 transition-all transform",
                isSelected ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
            )}>
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>
        </button>
    );
}));
ListItem.displayName = "ListItem";

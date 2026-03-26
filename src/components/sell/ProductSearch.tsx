'use client';

import React, { useState, useMemo, forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
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
import { useDebounce } from '@/hooks/useDebounce';
import { productService } from '@/services/product.service';
import { useAppStore } from '@/stores/appStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
                <Input id="custom-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button onClick={handleAdd}>Ajouter au panier</Button>
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
            const cats = await productService.getCategories();
            setCategories(cats);
        } catch (e) { toast.error("Impossible de charger les catégories de produits.")}
    }, []);

    const fetchProducts = useCallback(async () => {
        // If no search query and no specific category is selected, show nothing.
        if (!debouncedQuery.trim() && selectedCategory === 'all') {
            setProducts([]);
            return;
        }

        try {
            const prods = await productService.filterProducts({ query: debouncedQuery, category: selectedCategory, stockStatus: 'in_stock' });
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
            setQuery(''); // Clear search after selection
            inputRef.current?.focus();
        } else {
            toast.warning(`Stock insuffisant pour ${product.name}`);
        }
    }, [cartQuantities, onProductSelect]);


    const handleBarcodeScanned = async (scannedBarcode: string) => {
        if (!scannedBarcode.trim()) return;
        try {
            const product = await productService.getProductByBarcode(scannedBarcode.trim());
            if (product) {
                handleSelectProduct(product);
            } else {
                toast.error("Produit non trouvé pour ce code-barres.");
            }
        } catch (error) {
            toast.error("Erreur lors de la recherche du produit.");
        }
    };
    
    const addCustomProduct = (name: string, price: number) => {
        const customProduct: Product = {
            uuid: `custom-${Date.now()}`,
            name: `(Perso) ${name}`,
            price,
            purchasePrice: price, // Assume purchase price is same as selling for custom items
            quantity: Infinity, // Represents one-time item
            minStockLevel: 0,
            category: 'Personnalisé',
            user_id: 'custom',
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
            } else if (products?.length === 1) {
                handleSelectProduct(products[0]);
            } else {
                handleBarcodeScanned(e.currentTarget.value);
            }
        }
    }, [products, selectedIndex, handleSelectProduct, handleBarcodeScanned]);

    return (
        <div className="p-4 flex flex-col h-full bg-transparent">
            <div className="relative mb-4">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    ref={inputRef}
                    placeholder="Scanner ou rechercher... (F1)"
                    className="pl-10 h-12 text-base"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
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
                    {products?.map((product, index) => {
                        const inCartQuantity = cartQuantities.get(product.uuid) || 0;
                        const availableQuantity = product.quantity - inCartQuantity;
                        return (
                            <ListItem
                                key={product.uuid}
                                ref={index === selectedIndex ? selectedItemRef : null}
                                product={product}
                                availableQuantity={availableQuantity}
                                onClick={() => handleSelectProduct(product)}
                                isLast={index === products.length - 1}
                                isSelected={index === selectedIndex}
                            />
                        )
                    })}
                     {products?.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                            {query.trim() || selectedCategory !== 'all' ? (
                                <p>Aucun produit trouvé pour votre recherche.</p>
                            ) : (
                                <p>Commencez à taper pour rechercher des produits.</p>
                            )}
                        </div>
                     )}
                </div>
            </ScrollArea>
             <div className="mt-4 flex-shrink-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" onClick={() => setIsCustomProductDialogOpen(true)} className="w-full">
                                <PackagePlus className="mr-2 h-4 w-4" /> Ajouter un produit personnalisé
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Ajouter un article non inventorié (F10)</p>
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
    isLast: boolean;
    isSelected: boolean;
}

const ListItem = React.memo(React.forwardRef<HTMLButtonElement, ListItemProps>(({ product, availableQuantity, onClick, isLast, isSelected }, ref) => {
    const isAvailable = availableQuantity > 0;
    const placeholder = getPlaceholder(product.category);

    return (
        <button 
            ref={ref}
            onClick={onClick}
            disabled={!isAvailable}
            className={cn(
                "w-full text-left flex items-center gap-4 p-2 rounded-lg hover:bg-primary/10 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                !isLast && "border-b border-white/5",
                isSelected && "bg-primary/20 ring-2 ring-primary"
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
                Stock: {availableQuantity}
            </div>
        </button>
    );
}));
ListItem.displayName = "ListItem";

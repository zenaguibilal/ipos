'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus, Minus, Trash2, X, PlusCircle, UserPlus, Percent, ShoppingBasket, MoreHorizontal, Loader2 } from 'lucide-react';
import type { Product, Customer, Cart, CartItem, SaleItem, SalePayment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCarts } from '@/hooks/useCarts';
import { useSellHotkeys } from '@/hooks/useSellHotkeys';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentDialog } from '@/components/sell/PaymentDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';


type Placeholder = { url: string; width: number; height: number; hint: string };
const placeholders = placeholderImages as Record<string, Placeholder>;

const getPlaceholder = (category?: string): Placeholder => {
    if (category && placeholders[category]) {
        return placeholders[category];
    }
    return placeholders.default;
};

const SellProductCard = ({ product, onAddToCart }: { product: Product, onAddToCart: (product: Product) => void }) => {
    const isOutOfStock = product.quantity <= 0;
    const isLowStock = !isOutOfStock && product.quantity <= product.minStockLevel;

    const placeholder = getPlaceholder(product.category);
    const imageUrl = product.imageUrl || placeholder.url;

    return (
        <Card
            onClick={() => !isOutOfStock && onAddToCart(product)}
            className={cn(
                "overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
                isOutOfStock ? "cursor-not-allowed opacity-50 bg-secondary" : "cursor-pointer"
            )}
        >
            <div className="relative">
                <Image
                    src={imageUrl}
                    alt={product.name}
                    width={placeholder.width}
                    height={placeholder.height}
                    className="w-full h-28 object-cover"
                    data-ai-hint={product.imageUrl ? product.name.split(' ').slice(0, 2).join(' ') : placeholder.hint}
                />
                {(isOutOfStock || isLowStock) && (
                    <div className={cn(
                        "absolute top-1 right-1 text-white text-xs font-bold px-2 py-0.5 rounded-full",
                        isOutOfStock ? "bg-destructive" : "bg-yellow-500"
                    )}>
                        {isOutOfStock ? 'Épuisé' : 'Stock Faible'}
                    </div>
                )}
            </div>
            <div className="p-3">
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">Stock: {product.quantity}</span>
                    <span className="font-bold text-primary">{product.price.toFixed(1)} DA</span>
                </div>
            </div>
        </Card>
    );
};

const CartItemCard = ({ item, onUpdateQuantity, onRemoveItem }: { item: CartItem, onUpdateQuantity: (itemId: number | string, newQuantity: number) => void, onRemoveItem: (itemId: number | string) => void }) => {
    const placeholder = getPlaceholder(item.category);
    const imageUrl = item.imageUrl || placeholder.url;

    return (
        <div className={cn("flex items-center gap-3 py-3", item.flash && 'animate-flash')}>
            <Image 
                src={imageUrl} 
                alt={item.name} 
                width={100}
                height={100}
                className="h-12 w-12 rounded-md object-cover"
                data-ai-hint={item.imageUrl ? item.name.split(' ').slice(0, 2).join(' ') : placeholder.hint}
            />
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold truncate text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.cartQuantity} x {item.price.toFixed(1)} DA</p>
            </div>
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.cartQuantity - 1)}><Minus className="h-4 w-4" /></Button>
                <Input
                    type="number"
                    value={item.cartQuantity}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="h-7 w-12 text-center p-0"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.cartQuantity + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            <p className="font-bold w-16 text-right">{(item.price * item.cartQuantity).toFixed(1)} DA</p>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
    );
};


export default function SellPage() {
    const products = useLiveQuery(() => db.products.orderBy('name').toArray());
    const customers = useLiveQuery(() => db.customers.orderBy('lastName').toArray());
    const { carts, activeCartId, addCart, removeCart, setActiveCartId, updateCart, clearCart } = useCarts();

    // Component State
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [customProductName, setCustomProductName] = useState('');
    const [customProductPrice, setCustomProductPrice] = useState('');
    const [isCustomProductPopoverOpen, setIsCustomProductPopoverOpen] = useState(false);

    useEffect(() => {
        const savedCategory = localStorage.getItem('sell_page_category_filter');
        if (savedCategory) {
            setCategoryFilter(savedCategory);
        }
        const savedSearch = localStorage.getItem('sell_search_query');
        if (savedSearch !== null) {
            setSearchQuery(savedSearch);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('sell_page_category_filter', categoryFilter);
    }, [categoryFilter]);

    useEffect(() => {
        localStorage.setItem('sell_search_query', searchQuery);
    }, [searchQuery]);

    // Derived State
    const activeCart = useMemo(() => carts?.find(c => c.id === activeCartId), [carts, activeCartId]);

    const { categories, visibleCategories, hiddenCategories } = useMemo(() => {
        if (!products) return { categories: ['all'], visibleCategories: ['all'], hiddenCategories: [] };
        const allCats = products.reduce((acc, p) => {
            if (p.category) acc.add(p.category);
            return acc;
        }, new Set<string>());
        const categoriesArray = ['all', ...Array.from(allCats).sort()];
        const MAX_VISIBLE_CATEGORIES = 4;
        return {
            categories: categoriesArray,
            visibleCategories: categoriesArray.slice(0, MAX_VISIBLE_CATEGORIES),
            hiddenCategories: categoriesArray.slice(MAX_VISIBLE_CATEGORIES),
        }
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcodes?.some(b => b.includes(searchQuery));
            return matchesCategory && matchesSearch;
        });
    }, [products, categoryFilter, searchQuery]);

    const { subtotal, discountAmount, total } = useMemo(() => {
        if (!activeCart) return { subtotal: 0, discountAmount: 0, total: 0 };
        const sub = activeCart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
        let disc = 0;
        if (activeCart.discount.type === 'fixed') {
            disc = activeCart.discount.value;
        } else if (activeCart.discount.type === 'percentage') {
            disc = (sub * activeCart.discount.value) / 100;
        }
        const tot = sub - disc;
        return { subtotal: sub, discountAmount: disc, total: tot };
    }, [activeCart]);
    
    useEffect(() => {
        if (activeCart && activeCart.items.some(item => item.flash)) {
            const timer = setTimeout(() => {
                updateCart({
                    ...activeCart,
                    items: activeCart.items.map(item => ({ ...item, flash: false }))
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [activeCart, updateCart]);

    const handleAddToCart = useCallback((product: Product) => {
        if (!activeCart) return;
        if (!product.id) return; // Should not happen with Dexie

        const existingItem = activeCart.items.find(item => item.id === product.id);
        const stockAvailable = existingItem ? product.quantity - existingItem.cartQuantity : product.quantity;

        if (stockAvailable <= 0) {
            toast.error(`Stock épuisé pour ${product.name}.`);
            return;
        }

        let newItems: CartItem[];
        if (existingItem) {
            newItems = activeCart.items.map(item =>
                item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1, flash: true } : { ...item, flash: false }
            );
        } else {
            const productToAdd: CartItem = { ...product, id: product.id, cartQuantity: 1, flash: true };
            newItems = [...activeCart.items.map(i => ({...i, flash: false})), productToAdd];
        }
        updateCart({ ...activeCart, items: newItems });
        toast.success(`${product.name} ajouté au panier.`);

    }, [activeCart, updateCart]);

    const handleBarcodeScanned = useCallback((searchTerm: string) => {
        if (!searchTerm.trim() || !products) return;

        const term = searchTerm.trim();
        const termLowerCase = term.toLowerCase();

        let product = products.find(p => p.barcodes?.includes(term));

        if (!product) {
            product = products.find(p => p.name.toLowerCase() === termLowerCase);
        }

        if (product) {
            handleAddToCart(product);
            setSearchQuery('');
        } else {
            toast.error(`Aucun produit trouvé pour "${term}".`);
        }
    }, [products, handleAddToCart]);
    
    const handleAddCustomProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCart || !customProductName.trim() || !customProductPrice) {
            toast.error("Veuillez entrer un nom et un prix pour le produit personnalisé.");
            return;
        }
        const priceNum = parseFloat(customProductPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error("Veuillez entrer un prix valide.");
            return;
        }
    
        const customItem: CartItem = {
            id: `custom-${uuidv4()}`,
            name: customProductName.trim(),
            price: priceNum,
            purchasePrice: 0,
            quantity: Infinity,
            minStockLevel: 0,
            cartQuantity: 1,
            flash: true,
            category: 'Personnalisé',
            imageUrl: placeholders['Personnalisé'].url,
        };
    
        const newItems = [...activeCart.items.map(i => ({...i, flash: false})), customItem];
        updateCart({ ...activeCart, items: newItems });
        
        toast.success(`"${customItem.name}" ajouté au panier.`);
        
        setCustomProductName('');
        setCustomProductPrice('');
        setIsCustomProductPopoverOpen(false);
    };

    const handleUpdateCartQuantity = useCallback((itemId: number | string, newQuantity: number) => {
        if (!activeCart || !products) return;

        const itemToUpdate = activeCart.items.find(i => i.id === itemId);
        if (!itemToUpdate) return;
        
        if (newQuantity <= 0) {
            const newItems = activeCart.items.filter(i => i.id !== itemId);
            updateCart({ ...activeCart, items: newItems });
            return;
        }
        
        // Find stock limit only if it's not a custom product
        if (typeof itemId === 'number') {
            const productInStock = products.find(p => p.id === itemId);
            const stockLimit = productInStock ? productInStock.quantity : 0;
            if (newQuantity > stockLimit) {
                toast.warning(`Stock limité à ${stockLimit} pour ${itemToUpdate.name}.`);
                newQuantity = stockLimit;
            }
        }

        const newItems = activeCart.items.map(item =>
            item.id === itemId ? { ...item, cartQuantity: newQuantity } : item
        );
        updateCart({ ...activeCart, items: newItems });
    }, [activeCart, updateCart, products]);

    const handleRemoveFromCart = useCallback((itemId: number | string) => {
        if (!activeCart) return;
        const newItems = activeCart.items.filter(i => i.id !== itemId);
        updateCart({ ...activeCart, items: newItems });
    }, [activeCart, updateCart]);

    const handleSetCustomer = useCallback((customerId: string | null) => {
        if (!activeCart) return;
        if (customerId === null) {
            updateCart({
                ...activeCart,
                customerId: null,
                customerName: 'Vente au comptoir'
            });
            return;
        }
        const customer = customers?.find(c => c.id === parseInt(customerId));
        updateCart({
            ...activeCart,
            customerId: customer?.id ?? null,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Vente au comptoir'
        });
    }, [activeCart, customers, updateCart]);

    const handleSetDiscount = useCallback((type: 'fixed' | 'percentage', value: number) => {
        if (!activeCart) return;
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) return;
        
        updateCart({ ...activeCart, discount: { type, value: numValue } });
    }, [activeCart, updateCart]);

    const handleFinalizeSale = async (payments: SalePayment[], amountPaid: number) => {
        if (!activeCart || activeCart.items.length === 0) {
            toast.error("Le panier est vide ou une erreur est survenue.");
            return false;
        }

        const isCreditSale = total - amountPaid > 0.01;
        if (isCreditSale && !activeCart.customerId) {
            toast.error("Veuillez sélectionner un client pour une vente à crédit.");
            return false;
        }

        const saleItems: SaleItem[] = activeCart.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice ?? 0,
            quantity: item.cartQuantity,
        }));

        try {
            await dataService.finalizeSale({
                items: saleItems,
                subtotal,
                discountType: activeCart.discount.type,
                discountAmount,
                total,
                amountPaid,
                payments,
                customerId: activeCart.customerId ?? undefined,
                customerName: activeCart.customerName,
            });

            toast.success("Vente enregistrée avec succès !");
            clearCart(activeCart.id);
            return true;
        } catch (error: any) {
            console.error("Erreur lors de la finalisation de la vente:", error);
            toast.error(error.message || "Une erreur est survenue lors de la vente.");
            return false;
        }
    };

    useSellHotkeys({
        onFinalize: () => activeCart && activeCart.items.length > 0 && setIsPaymentDialogOpen(true),
        onCustomProduct: () => setIsCustomProductPopoverOpen(true),
    });

    const customerOptions = useMemo(() => {
        if (!customers) return [];
        const options = customers.map(c => ({
            value: String(c.id),
            label: `${c.firstName} ${c.lastName}`,
            subLabel: c.phone || undefined
        }));
        return [{ value: 'walk-in', label: 'Vente au comptoir', subLabel: 'Client par défaut' }, ...options];
    }, [customers]);

    const isLoading = products === undefined || customers === undefined || carts === undefined;

    if (isLoading) {
         return (
            <div className="h-full max-h-[calc(100vh-3.5rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4">Chargement de la caisse...</p>
            </div>
        )
    }

    return (
        <div className="h-full max-h-[calc(100vh-3.5rem)] grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
            <div className="lg:col-span-3 xl:col-span-4 bg-muted/30 flex flex-col">
                <div className="p-4 border-b space-y-4">
                     <div className="flex gap-2 items-center">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="product-search-input"
                                placeholder="Scanner ou rechercher un produit... (Enter)" 
                                className="pl-9" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleBarcodeScanned(searchQuery);
                                    }
                                }}
                            />
                        </div>
                         <Popover open={isCustomProductPopoverOpen} onOpenChange={setIsCustomProductPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-shrink-0">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Personnalisé (Alt+A)
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <form onSubmit={handleAddCustomProduct} className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Produit personnalisé</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Pour les articles qui ne sont pas dans l'inventaire.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="custom-name">Nom du produit</Label>
                                        <Input id="custom-name" value={customProductName} onChange={(e) => setCustomProductName(e.target.value)} autoFocus/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="custom-price">Prix (DA)</Label>
                                        <Input id="custom-price" type="number" value={customProductPrice} onChange={(e) => setCustomProductPrice(e.target.value)} />
                                    </div>
                                    <Button type="submit" className="w-full">Ajouter au panier</Button>
                                </form>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="flex-shrink-0 flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto">
                        {visibleCategories.map(cat => (
                            <Button key={cat} size="sm" variant={categoryFilter === cat ? 'default' : 'ghost'} onClick={() => setCategoryFilter(cat)} className="capitalize flex-shrink-0">{cat === 'all' ? 'Tous' : cat}</Button>
                        ))}
                        {hiddenCategories.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost">
                                        Plus <MoreHorizontal className="ml-1 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {hiddenCategories.map(cat => (
                                        <DropdownMenuItem key={cat} onSelect={() => setCategoryFilter(cat)} className="capitalize">{cat}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4">
                    {filteredProducts.length === 0 ? (
                         <div className="text-center py-16 text-muted-foreground">
                            {products && products.length > 0 ? "Aucun produit ne correspond à vos filtres." : "Aucun produit trouvé. Commencez par en ajouter depuis la page Produits."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {filteredProducts.map(p => <SellProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />)}
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-2 xl:col-span-1 bg-card border-l flex flex-col h-full">
                <Tabs value={activeCartId || ''} onValueChange={setActiveCartId} className="flex-grow flex flex-col">
                    <TabsList className="p-1 h-auto m-2">
                         {(carts || []).map(cart => (
                            <TabsTrigger key={cart.id} value={cart.id} className="flex-1 relative group">
                                {cart.name} ({cart.items.length})
                                {carts && carts.length > 1 && <X className="h-3 w-3 absolute top-1 right-1 text-muted-foreground opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeCart(cart.id); }} />}
                            </TabsTrigger>
                        ))}
                        <Button variant="ghost" size="icon" className="h-full" onClick={addCart}><PlusCircle className="h-4 w-4"/></Button>
                    </TabsList>
                   
                    {(carts || []).map(cart => (
                         <TabsContent key={cart.id} value={cart.id} className="flex-grow flex flex-col overflow-hidden m-0 mt-0">
                            <div className="px-4 pb-2 border-b">
                                <Label>Client</Label>
                                <div className="flex gap-2 mt-1">
                                    <Combobox
                                        options={customerOptions ?? []}
                                        value={cart.customerId ? String(cart.customerId) : 'walk-in'}
                                        onSelect={(val) => handleSetCustomer(val === 'walk-in' ? null : val)}
                                        placeholder="Sélectionner un client"
                                        searchPlaceholder="Rechercher un client..."
                                        notFoundMessage="Aucun client trouvé."
                                    />
                                    <Button variant="outline" size="icon" onClick={() => setIsCustomerDialogOpen(true)}><UserPlus className="h-4 w-4"/></Button>
                                </div>
                            </div>

                            {cart.items.length === 0 ? (
                                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                    <ShoppingBasket className="h-16 w-16 text-muted-foreground/50"/>
                                    <h3 className="mt-4 font-semibold">Le panier est vide</h3>
                                    <p className="text-sm text-muted-foreground">Ajoutez des produits pour commencer.</p>
                                </div>
                            ) : (
                                <div className="flex-grow overflow-y-auto px-4 divide-y">
                                    {cart.items.map(item => (
                                        <CartItemCard 
                                            key={item.id} 
                                            item={item} 
                                            onUpdateQuantity={handleUpdateCartQuantity}
                                            onRemoveItem={handleRemoveFromCart}
                                        />
                                    ))}
                                </div>
                            )}

                             {activeCart?.id === cart.id && (
                                <div className="p-4 mt-auto border-t bg-secondary/30 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Sous-total</span>
                                        <span className="font-medium">{subtotal.toFixed(1)} DA</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="link" className="p-0 h-auto">Remise</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-60">
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="discount-value">Valeur</Label>
                                                        <Input id="discount-value" type="number" value={activeCart.discount.value} onChange={(e) => handleSetDiscount(activeCart.discount.type, parseFloat(e.target.value))} />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant={activeCart.discount.type === 'fixed' ? 'default' : 'outline'} onClick={() => handleSetDiscount('fixed', activeCart.discount.value)}>Fixe (DA)</Button>
                                                        <Button size="sm" variant={activeCart.discount.type === 'percentage' ? 'default' : 'outline'} onClick={() => handleSetDiscount('percentage', activeCart.discount.value)}>%</Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <span className="font-medium text-destructive">- {discountAmount.toFixed(1)} DA</span>
                                    </div>
                                    <div className="border-t"></div>
                                    <div className="flex justify-between items-center text-2xl font-bold">
                                        <span>TOTAL</span>
                                        <span className="text-primary">{total.toFixed(1)} DA</span>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" size="lg" className="w-1/4" onClick={() => clearCart(cart.id)}><Trash2/></Button>
                                        <Button size="lg" className="w-3/4" onClick={() => setIsPaymentDialogOpen(true)} disabled={cart.items.length === 0}>Vente (F4)</Button>
                                    </div>
                                </div>
                             )}
                         </TabsContent>
                    ))}
                </Tabs>
            </div>
            
            <CustomerDialog 
                isOpen={isCustomerDialogOpen} 
                onOpenChange={setIsCustomerDialogOpen} 
                customer={null} 
                onCustomerAdded={(newCustomer) => {
                    if (newCustomer.id) handleSetCustomer(String(newCustomer.id))
                }}
            />
            
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                totalAmount={total}
                onConfirm={handleFinalizeSale}
            />
        </div>
    );
}

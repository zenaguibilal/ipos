'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, doc, runTransaction, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, PlusCircle, X, Trash2, Minus, Plus, User, FilePlus2, CheckCircle, Barcode, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, Customer, SaleItem, CompanyProfile, Sale, Payment } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { v4 as uuidv4 } from 'uuid';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { SaleCompleteDialog } from '@/components/sales/sale-complete-dialog';
import { AddCustomProductDialog } from '@/components/sales/add-custom-product-dialog';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// Define Cart types locally
type CartItem = SaleItem & { cartQuantity: number };
interface Cart {
  id: string;
  name: string;
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

// Helper component for Product Card
const ProductCard = ({ product, onAddToCart, isInCart }: { product: Product; onAddToCart: (product: Product) => void; isInCart: boolean; }) => {
    const isOutOfStock = product.quantity <= 0;
    const isLowStock = !isOutOfStock && product.quantity > 0 && product.quantity <= product.minStockLevel;
    
    return (
        <Card 
            className={cn(
                "overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col relative",
                isOutOfStock && "opacity-50 cursor-not-allowed",
                isInCart && "ring-2 ring-primary"
            )}
            onClick={() => !isOutOfStock && onAddToCart(product)}
        >
             {isInCart && (
                <div className="absolute top-2 right-2 z-10 bg-primary rounded-full p-1 text-primary-foreground">
                    <CheckCircle className="h-4 w-4" />
                </div>
            )}
            <div className="aspect-square relative bg-muted">
                <Image
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200`}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                    className={cn("object-cover transition-transform", isInCart && "scale-105")}
                    data-ai-hint={product.name.split(' ').slice(0, 2).join(' ')}
                />
                 {isOutOfStock ? (
                    <Badge variant="destructive" className="absolute top-2 left-2">Épuisé</Badge>
                ) : isLowStock && (
                     <Badge variant="secondary" className="absolute top-2 left-2">Stock Faible</Badge>
                )}
            </div>
            <div className="p-2 text-sm flex-grow flex flex-col">
                <h3 className="font-semibold truncate h-5">{product.name}</h3>
                <div className="mt-auto pt-1 flex justify-between items-center">
                    <p className="text-primary font-bold">{product.price.toFixed(1)} DA</p>
                    <p className="text-xs text-muted-foreground font-semibold">
                        Stock: {product.quantity}
                    </p>
                </div>
            </div>
        </Card>
    );
};


export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data Fetching
    const productsQuery = useMemoFirebase(() => user && firestore ? query(collection(firestore, 'users', user.uid, 'products'), orderBy('createdAt', 'desc')) : null, [user, firestore]);
    const customersQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const salesQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsQuery = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsQuery);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);

    // Component State
    const [carts, setCarts] = useState<Cart[]>([]);
    const [activeCartId, setActiveCartId] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [isCustomProductDialogOpen, setIsCustomProductDialogOpen] = useState(false);
    const [completedSale, setCompletedSale] = useState<Sale | null>(null);
    const [completedSaleCustomer, setCompletedSaleCustomer] = useState<Customer | null>(null);
    const [cartToPay, setCartToPay] = useState<Cart | null>(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
    const [isSavingSale, setIsSavingSale] = useState(false);
    const [cartToClear, setCartToClear] = useState<Cart | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [lastTouchedItemId, setLastTouchedItemId] = useState<string | null>(null);


    // Initialize carts on component mount
    useEffect(() => {
        setIsClient(true);
        if (carts.length === 0) {
            const firstCartId = addNewCart();
            setActiveCartId(firstCartId);
        }
        // Focus barcode input on page load
        barcodeInputRef.current?.focus();
    }, []);
    
     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'i') {
                event.preventDefault();
                barcodeInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    useEffect(() => {
        if (lastTouchedItemId) {
          const timer = setTimeout(() => {
            setLastTouchedItemId(null);
          }, 1500); // Must match animation duration
          return () => clearTimeout(timer);
        }
    }, [lastTouchedItemId]);

    const categories = useMemo(() => {
        if (!products) return [];
        const allCategories = products.map(p => p.category).filter(Boolean);
        return ['all', ...Array.from(new Set(allCategories as string[]))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];

        let baseProducts = [...products];

        // 1. Filter by category
        let categoryFiltered = selectedCategory === 'all'
            ? baseProducts
            : baseProducts.filter(p => p.category === selectedCategory);

        // 2. If there is a search query, filter within the category
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            return categoryFiltered.filter(p =>
                p.name.toLowerCase().includes(lowercasedQuery) ||
                p.barcodes?.some(b => b.includes(lowercasedQuery))
            );
        }
        
        // 3. If no search query, sort by popularity within the category
        if (sales && sales.length > 0) {
            const productSales: { [productId: string]: number } = {};
            sales.forEach(sale => {
                sale.items?.forEach(item => {
                    if (item.id && !item.id.startsWith('custom-')) {
                        productSales[item.id] = (productSales[item.id] || 0) + (item.cartQuantity || item.quantity);
                    }
                });
            });

            return categoryFiltered
                .sort((a, b) => (productSales[b.id] || 0) - (productSales[a.id] || 0));
        }

        return categoryFiltered;
    }, [products, sales, selectedCategory, searchQuery]);


    const addNewCart = () => {
        const newCartId = uuidv4();
        setCarts(prev => [...prev, {
            id: newCartId,
            name: `Panier ${prev.length + 1}`,
            items: [],
            customerId: null,
            customerName: 'Vente au comptoir',
            discountType: 'fixed',
            discountValue: 0
        }]);
        return newCartId;
    };

    const handleTabChange = (value: string) => {
        setActiveCartId(value);
        barcodeInputRef.current?.focus();
    };

    const handleAddTab = () => {
        if (carts.length >= 5) {
            toast.warning("Vous ne pouvez avoir que 5 paniers ouverts à la fois.");
            return;
        }
        const newId = addNewCart();
        setActiveCartId(newId);
    };

    const handleRemoveTab = (e: React.MouseEvent, cartIdToRemove: string) => {
        e.stopPropagation();
        if (carts.length === 1) {
            toast.error("Vous ne pouvez pas fermer le dernier panier.");
            return;
        }
        const cartIndex = carts.findIndex(c => c.id === cartIdToRemove);
        const newCarts = carts.filter(c => c.id !== cartIdToRemove);
        setCarts(newCarts);
        if (activeCartId === cartIdToRemove) {
            const newActiveIndex = Math.max(0, cartIndex - 1);
            setActiveCartId(newCarts[newActiveIndex].id);
        }
    };
    
    const activeCart = useMemo(() => carts.find(c => c.id === activeCartId), [carts, activeCartId]);
    
    const activeCartItemIds = useMemo(() => {
        if (!activeCart) return new Set();
        return new Set(activeCart.items.map(item => item.id));
    }, [activeCart]);


    const updateCart = (updatedCart: Cart) => {
        setCarts(prev => prev.map(c => c.id === updatedCart.id ? updatedCart : c));
    };

    const addProductToCart = (product: Product, quantity = 1) => {
        if (!activeCart) return;

        if (product.quantity < quantity) {
            toast.error(`Stock insuffisant pour ${product.name}. Disponible : ${product.quantity}`);
            return;
        }

        const existingItem = activeCart.items.find(item => item.id === product.id);
        let newItems;
        if (existingItem) {
            const newQuantity = existingItem.cartQuantity + quantity;
            if(product.quantity < newQuantity) {
                toast.error(`Stock insuffisant pour ${product.name}. Disponible : ${product.quantity}, Dans le panier : ${existingItem.cartQuantity}`);
                return;
            }
            newItems = activeCart.items.map(item =>
                item.id === product.id ? { ...item, cartQuantity: newQuantity } : item
            );
        } else {
            newItems = [...activeCart.items, { ...product, cartQuantity: quantity }];
        }
        updateCart({ ...activeCart, items: newItems });
        toast.success(`${product.name} ajouté au panier.`);
        setLastTouchedItemId(product.id);
    };

    const addCustomProductToCart = (name: string, price: number) => {
        if (!activeCart) return;

        const newItem: CartItem = {
            id: `custom-${uuidv4()}`,
            name,
            price,
            purchasePrice: 0,
            quantity: Infinity, // Not a stock-managed item
            cartQuantity: 1,
            createdAt: new Date(),
        };

        const newItems = [...activeCart.items, newItem];
        updateCart({ ...activeCart, items: newItems });
        toast.success(`${name} ajouté au panier.`);
        setLastTouchedItemId(newItem.id);
    };

    const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = e.currentTarget.value.trim();
            if (!barcode) return;

            const foundProduct = products?.find(p => p.barcodes?.includes(barcode));
            if (foundProduct) {
                addProductToCart(foundProduct);
            } else {
                toast.error(`Produit non trouvé pour le code-barres : ${barcode}`);
            }
            e.currentTarget.value = ''; // Clear input after scan
        }
    };

    const updateItemQuantity = (cartId: string, productId: string, newQuantity: number) => {
        const cartToUpdate = carts.find(c => c.id === cartId);
        if (!cartToUpdate) return;
        
        if (newQuantity <= 0) {
            const newItems = cartToUpdate.items.filter(item => item.id !== productId);
            updateCart({ ...cartToUpdate, items: newItems });
            return;
        }

        const productInStock = products?.find(p => p.id === productId);
        if (productInStock && productInStock.quantity < newQuantity) {
            toast.error(`Stock insuffisant pour ${productInStock.name}. Disponible : ${productInStock.quantity}`);
            return;
        }

        const newItems = cartToUpdate.items.map(item =>
            item.id === productId ? { ...item, cartQuantity: newQuantity } : item
        );
        updateCart({ ...cartToUpdate, items: newItems });
        setLastTouchedItemId(productId);
    };

    const customerDebts = useMemo(() => {
        if (!customers || !sales || !payments) return new Map<string, number>();

        const debtMap = new Map<string, number>();
        customers.forEach(customer => {
            const customerSales = sales.filter(s => s.customerId === customer.id);
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            
            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = payments.filter(p => p.customerId === customer.id).reduce((acc, p) => acc + p.amount, 0);
            
            const outstandingBalance = totalSpent - totalPaidFromSales - totalStandalonePayments;
            const finalBalance = outstandingBalance < 0.01 ? 0 : outstandingBalance;

            debtMap.set(customer.id, finalBalance);
        });
        return debtMap;
    }, [customers, sales, payments]);

    const customerOptions: ComboboxOption[] = useMemo(() => {
        const options: ComboboxOption[] = customers?.map(c => {
            const debt = customerDebts.get(c.id);
            return {
                value: c.id,
                label: `${c.firstName} ${c.lastName}`,
                subLabel: debt !== undefined && debt > 0 ? `Dette: ${debt.toFixed(1)} DA` : undefined
            };
        }) || [];
        options.unshift({ value: 'walk-in', label: 'Vente au comptoir' });
        return options;
    }, [customers, customerDebts]);

    const handleCustomerSelect = (cart: Cart, customerId: string) => {
        if (customerId === 'walk-in') {
            updateCart({ ...cart, customerId: null, customerName: 'Vente au comptoir' });
        } else {
            const customer = customers?.find(c => c.id === customerId);
            if (customer) {
                updateCart({ ...cart, customerId: customer.id, customerName: `${customer.firstName} ${customer.lastName}` });
                const debt = customerDebts.get(customerId);
                if (debt && debt > 0) {
                    toast.warning(`Ce client a une dette de ${debt.toFixed(1)} DA.`, {
                        description: `${customer.firstName} ${customer.lastName}`,
                        action: {
                            label: 'Voir détails',
                            onClick: () => router.push(`/customers/${customerId}`),
                        },
                    });
                }
            }
        }
    };

    const handleDiscountValueChange = (cart: Cart, value: string) => {
        updateCart({ ...cart, discountValue: parseFloat(value) || 0 });
    };
    
    const handleDiscountTypeChange = (cart: Cart, type: 'fixed' | 'percentage') => {
        updateCart({ ...cart, discountType: type });
    };

    const handleFinalizeSale = async () => {
        if (!cartToPay || cartToPay.items.length === 0 || !user || !firestore) return;
        setIsSavingSale(true);

        const { subtotal, discount, total } = (() => {
            const sub = cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
            let disc = 0;
            if(cartToPay.discountType === 'fixed') {
                disc = cartToPay.discountValue;
            } else {
                disc = sub * (cartToPay.discountValue / 100);
            }
            const tot = sub - disc;
            return { subtotal: sub, discount: disc, total: tot > 0 ? tot : 0 };
        })();

        const saleId = doc(collection(firestore, 'users', user.uid, 'sales')).id;
        
        let finalPaymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        const amountPaidNum = parseFloat(amountPaid) || 0;
        const remainingBalance = total - amountPaidNum;
        if (amountPaidNum >= total) finalPaymentStatus = 'paid';
        else if (amountPaidNum > 0) finalPaymentStatus = 'partial';

        const saleItemsForDb: Omit<SaleItem, 'cartQuantity' | 'createdAt'>[] = cartToPay.items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice,
            quantity: item.cartQuantity,
        }));
        
        const newSaleData: Omit<Sale, 'id' | 'createdAt'> = {
            invoiceNumber: `INV-${Date.now()}`,
            items: saleItemsForDb,
            subtotal,
            discountType: cartToPay.discountType,
            discountAmount: cartToPay.discountValue,
            total,
            amountPaid: amountPaidNum,
            remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
            paymentStatus: finalPaymentStatus,
            paymentMethod: paymentMethod,
            customerId: cartToPay.customerId ?? undefined,
            customerName: cartToPay.customerName,
        };

        try {
            // Run as a transaction
            await runTransaction(firestore, async (transaction) => {
                // 1. Read and Update Product Stock
                for (const item of cartToPay.items) {
                    if (item.id.startsWith('custom-')) continue;

                    const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                    const productDoc = await transaction.get(productRef);

                    if (!productDoc.exists()) {
                        throw new Error(`Produit ${item.name} introuvable dans l'inventaire.`);
                    }

                    const currentQuantity = productDoc.data().quantity;
                    if (currentQuantity < item.cartQuantity) {
                        throw new Error(`Stock insuffisant pour ${item.name}. Disponible : ${currentQuantity}`);
                    }

                    const newQuantity = currentQuantity - item.cartQuantity;
                    transaction.update(productRef, { quantity: newQuantity });
                }

                // 2. Create the Sale Document
                const saleRef = doc(firestore, 'users', user.uid, 'sales', saleId);
                transaction.set(saleRef, { ...newSaleData, createdAt: serverTimestamp() });
            });
            
            // If transaction is successful:
            const completedSaleDataForDialog: Sale = {
                id: saleId,
                ...newSaleData,
                createdAt: new Date(), // Use current date for the dialog
            };

            toast.success("Vente enregistrée avec succès !");
            setCompletedSale(completedSaleDataForDialog);
            setCompletedSaleCustomer(customers?.find(c => c.id === cartToPay.customerId) || null);
            setCartToPay(null);
            
            // Reset cart
            const newCarts = carts.filter(c => c.id !== cartToPay.id);
            if (newCarts.length === 0) {
                 const newId = addNewCart();
                 setActiveCartId(newId);
            } else {
                 setCarts(newCarts);
                 // If the active cart was the one that was paid, switch to another one
                 if (activeCartId === cartToPay.id) {
                    setActiveCartId(newCarts[0].id);
                 }
            }

        } catch (error: any) {
            console.error("Erreur lors de la finalisation de la vente:", error);
            toast.error(error.message || "Une erreur est survenue lors de la sauvegarde de la vente.");
        } finally {
            setIsSavingSale(false);
        }
    };
    
    const handleClearCart = () => {
        if (!cartToClear) return;
        updateCart({ ...cartToClear, items: [], discountType: 'fixed', discountValue: 0 });
        toast.info("Le panier a été vidé.");
        setCartToClear(null);
    };

    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingCompany || isLoadingSales || isLoadingPayments;
    
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !isClient || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement de l'interface de vente...</p></div>;
    }


    return (
        <>
            {user && (
                <CustomerDialog
                    isOpen={isAddCustomerOpen}
                    onOpenChange={setIsAddCustomerOpen}
                    customer={null}
                    userId={user.uid}
                    onCustomerAdded={(newCustomer) => {
                        if (activeCart) {
                            handleCustomerSelect(activeCart, newCustomer.id)
                        }
                    }}
                />
            )}
             <AddCustomProductDialog 
                isOpen={isCustomProductDialogOpen}
                onOpenChange={setIsCustomProductDialogOpen}
                onConfirm={addCustomProductToCart}
            />
            {completedSale && (
                <SaleCompleteDialog
                    isOpen={!!completedSale}
                    onOpenChange={() => setCompletedSale(null)}
                    sale={completedSale}
                    customer={completedSaleCustomer}
                    companyProfile={companyProfile}
                />
            )}
             <Dialog open={!!cartToPay} onOpenChange={(isOpen) => !isOpen && setCartToPay(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finaliser la vente</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                        <div className="text-center py-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">Total à payer</p>
                            <p className="text-4xl font-bold">
                                {cartToPay ? (cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) - (cartToPay.discountType === 'fixed' ? cartToPay.discountValue : cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) * (cartToPay.discountValue / 100))).toFixed(1) : '0.0'} DA
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount-paid">Montant Payé (DA)</Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    autoFocus
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFinalizeSale()}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-method">Méthode</Label>
                                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)}>
                                    <SelectTrigger id="payment-method">
                                        <SelectValue placeholder="Méthode..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Espèces</SelectItem>
                                        <SelectItem value="card">Carte</SelectItem>
                                        <SelectItem value="other">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-sm">
                           <Button type="button" variant="outline" onClick={() => setAmountPaid(cartToPay ? (cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) - (cartToPay.discountType === 'fixed' ? cartToPay.discountValue : cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) * (cartToPay.discountValue / 100))).toFixed(1) : '0')}>Exact</Button>
                           <Button type="button" variant="outline" onClick={() => setAmountPaid('500')}>500</Button>
                           <Button type="button" variant="outline" onClick={() => setAmountPaid('1000')}>1000</Button>
                           <Button type="button" variant="outline" onClick={() => setAmountPaid('2000')}>2000</Button>
                        </div>
                        {cartToPay &&
                            <div className="text-sm text-center">
                                {parseFloat(amountPaid) >= (cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) - (cartToPay.discountType === 'fixed' ? cartToPay.discountValue : cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) * (cartToPay.discountValue / 100))) ? (
                                    <p>Reste à rendre: <span className="font-bold text-green-500">{(parseFloat(amountPaid) - (cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) - (cartToPay.discountType === 'fixed' ? cartToPay.discountValue : cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) * (cartToPay.discountValue / 100)))).toFixed(1)} DA</span></p>
                                ) : (
                                    <p>Solde restant dû: <span className="font-bold text-destructive">{((cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) - (cartToPay.discountType === 'fixed' ? cartToPay.discountValue : cartToPay.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0) * (cartToPay.discountValue / 100))) - (parseFloat(amountPaid) || 0)).toFixed(1)} DA</span></p>
                                )}
                            </div>
                        }
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setCartToPay(null)} disabled={isSavingSale}>Annuler</Button>
                        <Button onClick={handleFinalizeSale} disabled={isSavingSale}>
                            {isSavingSale ? "Enregistrement..." : "Confirmer la vente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialog open={!!cartToClear} onOpenChange={(isOpen) => !isOpen && setCartToClear(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Tous les articles du panier actuel ({cartToClear?.items.length} articles) seront supprimés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCart} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Vider</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <main className="grid lg:grid-cols-[1fr,450px] xl:grid-cols-[1fr,500px] h-full max-h-[calc(100vh-theme(space.14))]">
                {/* Left Side: Product Grid */}
                <div className="flex flex-col p-4 gap-4 h-full">
                    <div className="flex gap-2 flex-col sm:flex-row">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Rechercher par nom ou code-barres..." 
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input ref={barcodeInputRef} placeholder="Scanner un code-barres (Ctrl+I)" onKeyDown={handleBarcodeScan} className="pl-9" />
                        </div>
                        <Button variant="outline" onClick={() => setIsCustomProductDialogOpen(true)}>
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            Article
                        </Button>
                    </div>

                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-2 pb-2">
                            {categories.map(category => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(category)}
                                    className="capitalize"
                                >
                                    {category === 'all' ? 'Tous' : category}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    
                    <h2 className="text-lg font-semibold tracking-tight -mb-2">
                        {searchQuery ? `Résultats de la recherche` : `Accès Rapide / Populaires ${selectedCategory !== 'all' ? `en ${selectedCategory}`: ''}`}
                    </h2>

                    <ScrollArea className="flex-grow">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pr-4">
                            {filteredProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onAddToCart={addProductToCart} 
                                    isInCart={activeCartItemIds.has(product.id)}
                                />
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="col-span-full h-full flex items-center justify-center text-muted-foreground">
                                    Aucun produit trouvé.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                
                {/* Right Side: Carts */}
                <div className="bg-card p-4 flex flex-col h-full border-l">
                    <Tabs value={activeCartId} onValueChange={handleTabChange} className="flex-grow flex flex-col">
                         <TabsList className="grid w-full grid-cols-6 h-auto">
                            {carts.map(cart => (
                                <TabsTrigger key={cart.id} value={cart.id} className="relative pr-8 data-[state=active]:z-10">
                                    {cart.name}
                                    <button onClick={(e) => handleRemoveTab(e, cart.id)} className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted-foreground/20">
                                        <X className="h-3 w-3" />
                                    </button>
                                </TabsTrigger>
                            ))}
                             {carts.length < 5 && <Button variant="ghost" size="icon" onClick={handleAddTab} className="col-start-6"><PlusCircle className="h-5 w-5" /></Button>}
                        </TabsList>

                        {carts.map(cart => (
                            <TabsContent key={cart.id} value={cart.id} className="flex-grow flex flex-col gap-4 m-0 mt-4 data-[state=inactive]:hidden">
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-lg flex justify-between items-center">
                                            Client
                                            <Button variant="outline" size="sm" onClick={() => setIsAddCustomerOpen(true)}>
                                                <PlusCircle className="mr-2 h-4 w-4" />Nouveau
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-grow">
                                                <Combobox
                                                    options={customerOptions}
                                                    onSelect={(customerId) => handleCustomerSelect(cart, customerId)}
                                                    value={cart.customerId || 'walk-in'}
                                                    placeholder="Vente au comptoir"
                                                    searchPlaceholder="Rechercher un client..."
                                                    notFoundMessage="Aucun client trouvé."
                                                />
                                            </div>
                                            {cart.customerId && (
                                                <Button 
                                                    type="button"
                                                    variant="outline" 
                                                    size="icon" 
                                                    onClick={() => handleCustomerSelect(cart, 'walk-in')}
                                                    aria-label="Retirer le client"
                                                    className="flex-shrink-0"
                                                >
                                                    <UserX className="h-5 w-5 text-muted-foreground" />
                                                </Button>
                                            )}
                                        </div>
                                         {(() => {
                                            const debt = cart.customerId ? customerDebts.get(cart.customerId) : 0;
                                            if (debt && debt > 0) {
                                                return (
                                                    <div className="mt-3 text-center text-sm font-semibold text-destructive bg-destructive/10 p-2 rounded-md">
                                                        Dette actuelle : <span className="font-bold">{debt.toFixed(1)} DA</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </CardContent>
                                </Card>

                                <Card className="flex-grow flex flex-col">
                                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg">Panier ({cart.items.length})</CardTitle>
                                        {cart.items.length > 0 && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setCartToClear(cart)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Vider le panier</span>
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-0 flex-1 flex flex-col">
                                        <ScrollArea className="flex-grow">
                                            {cart.items.length === 0 ? (
                                                <div className="flex-grow flex items-center justify-center text-muted-foreground h-full min-h-24">Le panier est vide</div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Produit</TableHead>
                                                            <TableHead className="w-[120px]">Quantité</TableHead>
                                                            <TableHead className="text-right">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {cart.items.map(item => (
                                                            <TableRow key={item.id} className={cn(lastTouchedItemId === item.id && 'animate-flash rounded-lg')}>
                                                                <TableCell>
                                                                    <div className="font-medium">{item.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{item.price.toFixed(1)} DA</div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(cart.id, item.id, item.cartQuantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                                        <Input type="number" value={item.cartQuantity} onChange={(e) => updateItemQuantity(cart.id, item.id, parseInt(e.target.value) || 0)} className="h-7 w-12 text-center" />
                                                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(cart.id, item.id, item.cartQuantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold">{(item.price * item.cartQuantity).toFixed(1)} DA</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </ScrollArea>
                                    </CardContent>
                                    {cart.items.length > 0 && (
                                        <CardFooter className="p-4 flex-col items-stretch space-y-2 border-t">
                                            {(
                                                () => {
                                                    const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
                                                    const discount = cart.discountType === 'fixed' ? cart.discountValue : subtotal * (cart.discountValue / 100);
                                                    const total = subtotal - discount > 0 ? subtotal - discount : 0;
                                                    
                                                    return (
                                                        <>
                                                            <div className="flex justify-between text-md">
                                                                <span>Sous-total</span>
                                                                <span>{subtotal.toFixed(1)} DA</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <Button size="sm" variant={cart.discountType === 'fixed' ? 'secondary' : 'ghost'} onClick={() => handleDiscountTypeChange(cart, 'fixed')}>Remise (DA)</Button>
                                                                    <Button size="sm" variant={cart.discountType === 'percentage' ? 'secondary' : 'ghost'} onClick={() => handleDiscountTypeChange(cart, 'percentage')}>Remise (%)</Button>
                                                                </div>
                                                                <Input type="number" value={cart.discountValue} onChange={(e) => handleDiscountValueChange(cart, e.target.value)} className="w-24 h-8" />
                                                            </div>
                                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                                <span>Total Remise</span>
                                                                <span>- {discount.toFixed(1)} DA</span>
                                                            </div>
                                                            <div className="border-t pt-2 mt-2">
                                                                <div className="flex justify-between text-2xl font-bold text-primary">
                                                                    <span>TOTAL</span>
                                                                    <span>{total.toFixed(1)} DA</span>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )
                                                }
                                            )()}
                                        </CardFooter>
                                    )}
                                </Card>

                                <div className="mt-auto">
                                    <Button 
                                        className="w-full text-lg py-7" 
                                        disabled={cart.items.length === 0}
                                        onClick={() => {
                                            const subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
                                            const discount = cart.discountType === 'fixed' ? cart.discountValue : subtotal * (cart.discountValue / 100);
                                            const total = subtotal - discount > 0 ? subtotal - discount : 0;
                                            setAmountPaid(total.toFixed(1));
                                            setPaymentMethod('cash');
                                            setCartToPay(cart);
                                        }}
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5" /> Finaliser la vente
                                    </Button>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </main>
        </>
    );
}

'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { collection, doc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { PlusCircle, Trash2, User, UserX, X, XCircle, ScanLine, HelpCircle, HardDriveDownload } from 'lucide-react';
import { cn, safeToDate } from '@/lib/utils';

import { AddProductForm } from '@/components/sell/add-product-form';
import { AddCustomProductForm } from '@/components/sell/add-custom-product-form';
import { PaymentDialog } from '@/components/sell/payment-dialog';
import { SaleCompleteDialog } from '@/components/sell/sale-complete-dialog';
import { ShortcutsHelpDialog } from '@/components/sell/shortcuts-help-dialog';
import { Combobox } from '@/components/ui/combobox';
import type { Product, Customer, Sale, SaleItem, CustomerWithSalesData, CompanyProfile } from '@/lib/types';


type ProductWithOptionalBarcode = Product & { barcode?: string };
type CartItem = SaleItem & { cartQuantity: number };

export default function SellPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Data fetching
    const productsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'products') : null, [user, firestore]);
    const customersCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'customers') : null, [user, firestore]);
    const salesCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, [user, firestore]);
    const paymentsCollectionRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, [user, firestore]);
    const companyDocRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);

    const { data: products, isLoading: isLoadingProducts } = useCollection<ProductWithOptionalBarcode>(productsCollectionRef);
    const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersCollectionRef);
    const { data: sales, isLoading: isLoadingSales } = useCollection<Sale>(salesCollectionRef);
    const { data: payments, isLoading: isLoadingPayments } = useCollection<Payment>(paymentsCollectionRef);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);


    // Component state
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSalesData | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isSaleComplete, setIsSaleComplete] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isProcessingSale, setIsProcessingSale] = useState(false);

    // Modal states
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [isAddingCustomProduct, setIsAddingCustomProduct] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    // Focus on search input on page load
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Memoized data processing
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
        if (!products) return [];
        if (!searchQuery) return [];
        const lowercasedQuery = searchQuery.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(lowercasedQuery)).slice(0, 50);
    }, [products, searchQuery]);

    const customersWithSales: CustomerWithSalesData[] = useMemo(() => {
        if (!customers || !sales || !payments) return [];
        const salesByCustomer = sales.reduce((acc, sale) => {
            if (sale.customerId) {
                if (!acc[sale.customerId]) acc[sale.customerId] = { totalSpent: 0, debtFromSales: 0 };
                acc[sale.customerId].totalSpent += sale.total;
                acc[sale.customerId].debtFromSales += sale.remainingBalance;
            }
            return acc;
        }, {} as Record<string, { totalSpent: number; debtFromSales: number }>);
        const paymentsByCustomer = payments.reduce((acc, payment) => {
             if (payment.customerId) {
                if (!acc[payment.customerId]) acc[payment.customerId] = 0;
                acc[payment.customerId] += payment.amount;
            }
            return acc;
        }, {} as Record<string, number>);
        return customers.map(customer => {
            const customerSales = salesByCustomer[customer.id] || { totalSpent: 0, debtFromSales: 0 };
            const customerPayments = paymentsByCustomer[customer.id] || 0;
            const outstandingBalance = customerSales.debtFromSales - customerPayments;
            return {
                ...customer,
                totalSpent: customerSales.totalSpent,
                outstandingBalance: outstandingBalance > 0 ? outstandingBalance : 0,
            };
        });
    }, [customers, sales, payments]);

     const customerOptions = useMemo(() => {
        if (!customersWithSales) return [];
        return customersWithSales.map(c => ({
            value: c.id,
            label: `${c.firstName} ${c.lastName}`,
            subLabel: c.outstandingBalance > 0 ? `Dette : ${c.outstandingBalance.toFixed(2)} DA` : undefined
        }));
    }, [customersWithSales]);

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    }, [cart]);

    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.cartQuantity, 0);
    }, [cart]);


    // Cart management functions
    const addProductToCart = (product: Product | SaleItem) => {
        const existingItem = cart.find(item => item.id === product.id);
        const productInStock = products?.find(p => p.id === product.id);
        const stockQuantity = productInStock ? productInStock.quantity : Infinity;

        if (existingItem) {
            if (existingItem.cartQuantity < stockQuantity) {
                setCart(cart.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item));
            } else {
                toast.warning(`Stock insuffisant pour ${product.name}.`);
            }
        } else {
             if (1 <= stockQuantity) {
                setCart([...cart, { ...product, cartQuantity: 1 }]);
            } else {
                toast.warning(`Stock insuffisant pour ${product.name}.`);
            }
        }
        setSearchQuery('');
        searchInputRef.current?.focus();
    };
    
    const addCustomProductToCart = (name: string, price: number) => {
        const customProduct: SaleItem = {
            id: `custom-${Date.now()}`,
            name,
            price,
            quantity: 0, // Not from inventory
        };
        addProductToCart(customProduct);
        setIsAddingCustomProduct(false);
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        const productInStock = products?.find(p => p.id === productId);
        const stockQuantity = productInStock ? productInStock.quantity : Infinity;

        if (newQuantity > stockQuantity) {
            toast.warning(`Stock insuffisant pour ${productInStock?.name}. Quantité max : ${stockQuantity}`);
            setCart(cart.map(item => item.id === productId ? { ...item, cartQuantity: stockQuantity } : item));
            return;
        }

        if (newQuantity <= 0) {
            setCart(cart.filter(item => item.id !== productId));
        } else {
            setCart(cart.map(item => item.id === productId ? { ...item, cartQuantity: newQuantity } : item));
        }
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
    };

    // Sale processing
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const product = productsByBarcode[searchQuery] || (filteredProducts && filteredProducts[0]);
        if (product) {
            addProductToCart(product);
        } else {
            toast.error("Produit non trouvé.");
        }
    };
    
    const handleSelectCustomer = (customerId: string) => {
        if (!customerId) {
            setSelectedCustomer(null);
            return;
        }
        const customer = customersWithSales.find(c => c.id === customerId);
        setSelectedCustomer(customer || null);
    }
    
    const handleFinalizeSale = (amountPaid: number) => {
        if (!firestore || !user) return;
        setIsProcessingSale(true);

        const newSale: Omit<Sale, 'id' | 'createdAt'> = {
            invoiceNumber: `INV-${Date.now()}`,
            items: cart.map(({ cartQuantity, ...item }) => ({...item, quantity: cartQuantity})), // save final quantity
            total: total,
            amountPaid: amountPaid,
            remainingBalance: total - amountPaid,
            paymentStatus: amountPaid >= total ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Vente au comptoir',
        };

        const batch = writeBatch(firestore);
        const salesRef = collection(firestore, 'users', user.uid, 'sales');
        const newSaleRef = doc(salesRef);
        batch.set(newSaleRef, { ...newSale, createdAt: serverTimestamp() });
        
        cart.forEach(item => {
            if (!item.id.startsWith('custom-')) {
                const productRef = doc(firestore, 'users', user.uid, 'products', item.id);
                const productInStock = products?.find(p => p.id === item.id);
                if (productInStock) {
                    const newQuantity = productInStock.quantity - item.cartQuantity;
                    batch.update(productRef, { quantity: newQuantity });
                }
            }
        });
        
        batch.commit().then(() => {
            setLastSale({ ...newSale, id: newSaleRef.id, createdAt: new Date() });
            setIsPaymentDialogOpen(false);
            setIsSaleComplete(true);
            clearCart();
        }).catch((err) => {
            console.error("Error finalizing sale:", err);
            toast.error("Erreur lors de la finalisation de la vente.");
        }).finally(() => {
            setIsProcessingSale(false);
        });
    };
    
    const handleNewSale = () => {
        setIsSaleComplete(false);
        setLastSale(null);
        clearCart();
        searchInputRef.current?.focus();
    }


    // Keyboard shortcuts
     const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Allow input if inside an input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
             if (event.key === 'F2' || event.key === 'F4' || (event.altKey && (event.key === 'a' || event.key === 'n'))){
                 // continue
             } else {
                return;
             }
        }
        
        if (event.key === 'F1') {
            event.preventDefault();
            setIsHelpOpen(true);
        } else if (event.key === 'F2') {
            event.preventDefault();
            searchInputRef.current?.focus();
        } else if (event.key === 'F4') {
            event.preventDefault();
            if (cart.length > 0) {
                setIsPaymentDialogOpen(true);
            } else {
                toast.info("Le panier est vide.");
            }
        } else if (event.altKey && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            setIsAddingCustomProduct(true);
        } else if (event.altKey && event.key.toLowerCase() === 'n') {
            event.preventDefault();
            setIsAddingProduct(true);
        }

    }, [cart.length]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);


    const isLoading = isUserLoading || isLoadingProducts || isLoadingCustomers || isLoadingSales || isLoadingPayments || isLoadingCompany;
    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <>
            <AddProductForm isOpen={isAddingProduct} onOpenChange={setIsAddingProduct} userId={user.uid} />
            <AddCustomProductForm isOpen={isAddingCustomProduct} onOpenChange={setIsAddingCustomProduct} onConfirm={addCustomProductToCart} />
            <ShortcutsHelpDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
            <PaymentDialog 
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                total={total}
                isProcessing={isProcessingSale}
                onConfirm={handleFinalizeSale}
            />
            {lastSale && (
                <SaleCompleteDialog
                    isOpen={isSaleComplete}
                    onOpenChange={handleNewSale}
                    sale={lastSale}
                    customer={selectedCustomer}
                    companyProfile={companyProfile}
                />
            )}
            
            <div className="flex flex-col h-full max-h-screen overflow-hidden p-4 gap-4">
                {/* Top section */}
                <header className="flex flex-col md:flex-row gap-4 items-start">
                    <Card className="flex-grow w-full">
                        <CardHeader className="p-4">
                            <form onSubmit={handleSearchSubmit}>
                                <Label htmlFor="search-product" className="sr-only">Rechercher un produit</Label>
                                <div className="relative">
                                    <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        ref={searchInputRef}
                                        id="search-product"
                                        placeholder="Scanner ou rechercher un produit par nom... (F2)"
                                        className="pl-10 text-base"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </form>
                        </CardHeader>
                        {filteredProducts.length > 0 && (
                             <CardContent className="p-2 pt-0 max-h-40 overflow-y-auto">
                                <ul className="divide-y divide-border">
                                    {filteredProducts.map(product => (
                                        <li key={product.id}>
                                            <button
                                                onClick={() => addProductToCart(product)}
                                                className="w-full text-left p-2 rounded-md hover:bg-muted text-sm flex justify-between items-center"
                                            >
                                                <span>{product.name}</span>
                                                <span className="font-semibold">{product.price.toFixed(2)} DA</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        )}
                    </Card>

                    <Card className="w-full md:max-w-sm">
                         <CardHeader className="p-4 flex-row items-center justify-between">
                            <CardTitle className="text-base">Client</CardTitle>
                             {selectedCustomer && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedCustomer(null)}>
                                    <UserX className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                           {selectedCustomer ? (
                                <div>
                                    <p className="font-semibold">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone || 'Pas de numéro'}</p>
                                    <p className={cn("text-sm font-semibold", selectedCustomer.outstandingBalance > 0 ? "text-destructive" : "text-green-500")}>
                                        Solde: {selectedCustomer.outstandingBalance.toFixed(2)} DA
                                    </p>
                                </div>
                            ) : (
                                <Combobox 
                                    options={[{value: '', label: 'Vente au comptoir'}, ...customerOptions]}
                                    onSelect={handleSelectCustomer}
                                    placeholder="Sélectionner un client..."
                                    searchPlaceholder="Rechercher un client..."
                                    notFoundMessage="Aucun client trouvé."
                                />
                            )}
                        </CardContent>
                    </Card>
                </header>

                {/* Main section - Cart */}
                <main className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden flex flex-col">
                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <HardDriveDownload className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">Le panier est vide</h3>
                            <p className="text-muted-foreground">Scannez un code-barres ou recherchez un produit pour commencer.</p>
                             <div className="flex gap-2 mt-4">
                                <Button variant="outline" onClick={() => setIsAddingProduct(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Nouveau Produit (Alt+N)
                                </Button>
                                <Button variant="outline" onClick={() => setIsAddingCustomProduct(true)}>
                                    Produit Personnalisé (Alt+A)
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setIsHelpOpen(true)}>
                                    <HelpCircle className="mr-2 h-4 w-4" /> Aide
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/50 z-10">
                                    <TableRow>
                                        <TableHead className="w-[50%]">Produit</TableHead>
                                        <TableHead className="w-[120px]">Quantité</TableHead>
                                        <TableHead className="text-right">Prix Unitaire</TableHead>
                                        <TableHead className="text-right">Sous-total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                 <div className="flex items-center">
                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}>-</Button>
                                                    <Input
                                                        type="number"
                                                        value={item.cartQuantity}
                                                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                                        className="w-14 h-8 text-center mx-1"
                                                    />
                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}>+</Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.price.toFixed(2)} DA</TableCell>
                                            <TableCell className="text-right font-semibold">{(item.price * item.cartQuantity).toFixed(2)} DA</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, 0)}>
                                                    <XCircle className="h-5 w-5 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </main>

                {/* Footer section */}
                <footer className="bg-card rounded-lg border shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                     <Button variant="destructive" onClick={clearCart} disabled={cart.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Vider le panier
                    </Button>
                    <div className="flex items-baseline gap-4 text-right">
                         <span className="text-muted-foreground">Total Articles: {totalItems}</span>
                        <div className="text-2xl font-bold">
                            Total: <span className="text-primary">{total.toFixed(2)} DA</span>
                        </div>
                    </div>
                     <Button size="lg" onClick={() => setIsPaymentDialogOpen(true)} disabled={cart.length === 0}>
                        Finaliser la Vente (F4)
                    </Button>
                </footer>
            </div>
        </>
    );
}

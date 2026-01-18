'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, XCircle, HardDriveDownload, PlusCircle, UserPlus, UserX, Wallet, HandCoins } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { CartItem, SalesSession } from '@/app/(app)/sell/page';
import type { Customer, Sale, Payment, ProductReturn } from '@/lib/types';
import { cn } from '@/lib/utils';


interface CartPanelProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onUpdatePrice: (productId: string, newPrice: number) => void;
    onClearCart: () => void;
    onFinalize: () => void;
    sessions: SalesSession[];
    activeSessionIndex: number;
    onSessionChange: (index: number) => void;
    onSessionAdd: () => void;
    onSessionClose: (index: number) => void;
    customers: Customer[];
    allSales: Sale[];
    allPayments: Payment[];
    allReturns: ProductReturn[];
    selectedCustomer?: string;
    onSelectCustomer: (customerId: string) => void;
    onClearCustomer: () => void;
    onAddNewCustomer: () => void;
    onPayDebt: () => void;
    subtotal: number;
    discount: number;
    total: number;
    discountType: 'percentage' | 'fixed';
    discountValue: string;
    onUpdateDiscount: (field: 'discountType' | 'discountValue', value: any) => void;
}

export function CartPanel({
    cart,
    onUpdateQuantity,
    onUpdatePrice,
    onClearCart,
    onFinalize,
    sessions,
    activeSessionIndex,
    onSessionChange,
    onSessionAdd,
    onSessionClose,
    customers,
    allSales,
    allPayments,
    allReturns,
    selectedCustomer,
    onSelectCustomer,
    onClearCustomer,
    onAddNewCustomer,
    onPayDebt,
    subtotal,
    discount,
    total,
    discountType,
    discountValue,
    onUpdateDiscount,
}: CartPanelProps) {
    
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editingPriceValue, setEditingPriceValue] = useState('');

    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.cartQuantity, 0);
    }, [cart]);

    const customerBalances = useMemo(() => {
        const balances = new Map<string, number>();
        customers.forEach(c => {
            const customerSales = allSales.filter(s => s.customerId === c.id);
            const customerPayments = allPayments.filter(p => p.customerId === c.id);
            const customerReturns = allReturns.filter(r => r.customerId === c.id);
            
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
            const totalReturnedValue = customerReturns.reduce((acc, r) => acc + r.totalReturnValue, 0);
            
            const balance = (totalSpent - totalReturnedValue) - (totalPaidFromSales + totalStandalonePayments);
            balances.set(c.id, balance < 0.01 ? 0 : balance);
        });
        return balances;
    }, [customers, allSales, allPayments, allReturns]);


    const customerOptions = useMemo<ComboboxOption[]>(() => {
        return customers.map(c => ({
            value: c.id,
            label: `${c.firstName} ${c.lastName}`,
            subLabel: `Solde: ${(customerBalances.get(c.id) || 0).toFixed(2)} DA`,
        }));
    }, [customers, customerBalances]);

    const selectedCustomerData = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
    const selectedCustomerBalance = selectedCustomer ? customerBalances.get(selectedCustomer) : 0;

    const handlePriceClick = (item: CartItem) => {
        setEditingPriceId(item.id);
        setEditingPriceValue(item.price.toString());
    };

    const handlePriceChangeCommit = () => {
        if (editingPriceId) {
            const newPrice = parseFloat(editingPriceValue);
            if (!isNaN(newPrice) && newPrice >= 0) {
                onUpdatePrice(editingPriceId, newPrice);
            }
            setEditingPriceId(null);
        }
    };

    const handlePriceInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handlePriceChangeCommit();
        } else if (e.key === 'Escape') {
            setEditingPriceId(null);
        }
    };


    return (
        <div className="h-full flex flex-col p-4">
            {/* Top non-scrolling section */}
            <div className="flex-shrink-0">
                {/* Sessions Bar */}
                <div className="flex items-center gap-2 mb-2 border-b pb-3">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-2">
                            {sessions.map((session, index) => (
                                <Button
                                    key={index}
                                    variant={index === activeSessionIndex ? 'default' : 'outline'}
                                    onClick={() => onSessionChange(index)}
                                    className="relative pr-8"
                                >
                                    Panier {index + 1} ({session.cart.reduce((acc, item) => acc + item.cartQuantity, 0)})
                                    {sessions.length > 1 && (
                                        <XCircle
                                            className="h-4 w-4 absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSessionClose(index);
                                            }}
                                        />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                    <Button variant="outline" size="icon" onClick={onSessionAdd}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>

                {/* Customer Selection */}
                <div className="mb-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Client</label>
                        <Button variant="link" className="h-auto p-0 text-xs" onClick={onAddNewCustomer}>
                           <UserPlus className="mr-1 h-3 w-3" /> Nouveau client
                        </Button>
                    </div>
                     <Combobox
                        options={customerOptions}
                        onSelect={onSelectCustomer}
                        value={selectedCustomer}
                        placeholder={"Vente au comptoir"}
                        searchPlaceholder="Rechercher un client..."
                        notFoundMessage="Aucun client trouvé."
                    />
                    
                    {selectedCustomerData && (
                        <Card className="p-3 bg-muted/50 space-y-2">
                             <div className="flex justify-between items-start">
                                 <div className="font-semibold">{selectedCustomerData.firstName} {selectedCustomerData.lastName}</div>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={onClearCustomer}>
                                    <UserX className="h-4 w-4 text-destructive" />
                                 </Button>
                             </div>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3 w-3"/> Solde Actuel:</span>
                                    <span className={cn("text-lg font-black", (selectedCustomerBalance || 0) > 0 ? "text-destructive" : "text-green-600")}>{(selectedCustomerBalance || 0).toFixed(2)} DA</span>
                                </div>
                                {cart.length > 0 && (
                                     <div className="flex justify-between items-center border-t border-dashed pt-2">
                                        <span className="text-sm text-muted-foreground">Nouveau Solde (si à crédit):</span>
                                        <span className="text-lg font-black text-primary">{((selectedCustomerBalance || 0) + total).toFixed(2)} DA</span>
                                    </div>
                                )}
                             </div>
                             {(selectedCustomerBalance || 0) > 0 && (
                                <Button size="sm" variant="secondary" className="w-full mt-1" onClick={onPayDebt}>
                                    <HandCoins className="mr-2 h-4 w-4" />
                                    Régler la dette
                                </Button>
                             )}
                        </Card>
                    )}
                </div>

                 {/* Action buttons */}
                 <div className="flex gap-2 mb-2">
                     <Button variant="destructive" onClick={onClearCart} disabled={cart.length === 0} className="w-1/3">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                     <Button size="lg" onClick={onFinalize} disabled={cart.length === 0} className="flex-1 text-lg h-14">
                        <HardDriveDownload className="mr-2 h-5 w-5" />
                        VENTE (F4)
                    </Button>
                 </div>
                 {/* Total Display */}
                 <div className="text-center p-3 rounded-lg bg-muted/50 mb-4 border">
                     <p className="text-sm font-medium text-muted-foreground">TOTAL</p>
                     <p className="text-4xl font-black text-primary tracking-tight">{total.toFixed(2)} DA</p>
                 </div>
            </div>

            {/* Middle scrolling section: Cart items */}
            <ScrollArea className="flex-1 min-h-0 border-t pt-4">
                <div className="h-full">
                    {cart.length === 0 ? (
                         <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                            <HardDriveDownload className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">Le panier est vide</h3>
                            <p className="text-muted-foreground">Ajoutez des produits pour commencer.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 pr-3">
                            {cart.map(item => (
                                <Card key={item.id} className="p-3 flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="font-medium line-clamp-1">{item.name}</p>
                                        {editingPriceId === item.id ? (
                                            <Input
                                                type="number"
                                                value={editingPriceValue}
                                                onChange={(e) => setEditingPriceValue(e.target.value)}
                                                onBlur={handlePriceChangeCommit}
                                                onKeyDown={handlePriceInputKeyDown}
                                                autoFocus
                                                className="h-7 text-sm w-24"
                                                step="0.01"
                                            />
                                        ) : (
                                            <p
                                                className="text-sm text-muted-foreground cursor-pointer hover:text-primary hover:underline"
                                                onClick={() => handlePriceClick(item)}
                                                title="Cliquer pour modifier le prix"
                                            >
                                                {item.price.toFixed(2)} DA
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.cartQuantity - 1)}>-</Button>
                                        <Input
                                            type="number"
                                            value={item.cartQuantity}
                                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                            className="w-12 h-7 text-center"
                                        />
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.cartQuantity + 1)}>+</Button>
                                    </div>
                                    <p className="font-semibold w-20 text-right">{(item.price * item.cartQuantity).toFixed(2)} DA</p>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, 0)}>
                                        <XCircle className="h-5 w-5 text-destructive" />
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            {/* Bottom non-scrolling section */}
            <div className="flex-shrink-0 mt-4">
                 {/* Discount section */}
                <div className="border-y py-4">
                    <Label>Remise sur le panier</Label>
                    <div className="flex gap-2 mt-2">
                        <Input 
                            type="number"
                            placeholder="0"
                            value={discountValue}
                            onChange={(e) => onUpdateDiscount('discountValue', e.target.value)}
                            className="h-10"
                        />
                        <Tabs value={discountType} onValueChange={(v) => onUpdateDiscount('discountType', v as any)} className="w-[100px]">
                            <TabsList className="grid w-full grid-cols-2 h-10">
                                <TabsTrigger value="fixed">DA</TabsTrigger>
                                <TabsTrigger value="percentage">%</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                 {/* Summary section */}
                 <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Articles</span>
                        <span>{totalItems}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Sous-total</span>
                        <span>{subtotal.toFixed(2)} DA</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                            <span>Remise</span>
                            <span>- {discount.toFixed(2)} DA</span>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
}

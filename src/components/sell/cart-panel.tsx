
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, XCircle, HardDriveDownload, PlusCircle, UserPlus, UserX, Wallet } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import type { CartItem, SalesSession } from '@/app/(app)/sell/page';
import type { Customer, Sale, Payment } from '@/lib/types';
import { cn } from '@/lib/utils';


interface CartPanelProps {
    cart: CartItem[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
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
    selectedCustomer?: string;
    onSelectCustomer: (customerId: string) => void;
    onClearCustomer: () => void;
    onAddNewCustomer: () => void;
}

export function CartPanel({
    cart,
    onUpdateQuantity,
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
    selectedCustomer,
    onSelectCustomer,
    onClearCustomer,
    onAddNewCustomer,
}: CartPanelProps) {
    
    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    }, [cart]);

    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.cartQuantity, 0);
    }, [cart]);

    const customerBalances = useMemo(() => {
        const balances = new Map<string, number>();
        customers.forEach(c => {
            const customerSales = allSales.filter(s => s.customerId === c.id);
            const customerPayments = allPayments.filter(p => p.customerId === c.id);
            
            const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
            const totalPaidFromSales = customerSales.reduce((acc, s) => acc + s.amountPaid, 0);
            const totalStandalonePayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
            
            const balance = totalSpent - totalPaidFromSales - totalStandalonePayments;
            balances.set(c.id, balance < 0.01 ? 0 : balance);
        });
        return balances;
    }, [customers, allSales, allPayments]);


    const customerOptions = useMemo<ComboboxOption[]>(() => {
        return customers.map(c => ({
            value: c.id,
            label: `${c.firstName} ${c.lastName}`,
            subLabel: `Solde: ${(customerBalances.get(c.id) || 0).toFixed(2)} DA`,
        }));
    }, [customers, customerBalances]);

    const selectedCustomerData = selectedCustomer ? customers.find(c => c.id === selectedCustomer) : null;
    const selectedCustomerBalance = selectedCustomer ? customerBalances.get(selectedCustomer) : 0;


    return (
        <div className="h-full flex flex-col">
            {/* Top section: Sessions and Customer */}
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
                        <Card className="p-3 bg-muted/50">
                             <div className="flex justify-between items-center">
                                 <div className="font-semibold">{selectedCustomerData.firstName} {selectedCustomerData.lastName}</div>
                                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearCustomer}>
                                    <UserX className="h-4 w-4 text-destructive" />
                                 </Button>
                             </div>
                             <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Wallet className="h-3 w-3"/> Solde Actuel:</span>
                                <span className={cn("font-bold", (selectedCustomerBalance || 0) > 0 ? "text-destructive" : "text-green-600")}>{(selectedCustomerBalance || 0).toFixed(2)} DA</span>
                             </div>
                        </Card>
                    )}
                </div>


                 {/* Action buttons */}
                 <div className="flex gap-2 mb-4">
                     <Button variant="destructive" onClick={onClearCart} disabled={cart.length === 0} className="w-1/3">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                     <Button size="lg" onClick={onFinalize} disabled={cart.length === 0} className="flex-1 text-lg h-14">
                        <HardDriveDownload className="mr-2 h-5 w-5" />
                        VENTE (F4)
                    </Button>
                 </div>
            </div>

            {/* Middle section: Cart items (scrollable) */}
            <div className="flex-1 min-h-0 border-t pt-4">
                <ScrollArea className="h-full">
                    {cart.length === 0 ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-center p-4 h-full">
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
                                        <p className="text-sm text-muted-foreground">{item.price.toFixed(2)} DA</p>
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
                </ScrollArea>
            </div>
            
            {/* Bottom section: Totals */}
            <div className="flex-shrink-0 mt-4 border-t pt-4">
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Articles</span>
                        <span>{totalItems}</span>
                    </div>
                     <div className="flex justify-between font-semibold text-xl">
                        <span>Total</span>
                        <span>{total.toFixed(2)} DA</span>
                    </div>
                 </div>
            </div>
        </div>
    );
}

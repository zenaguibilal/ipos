'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, User, UserX, XCircle, HardDriveDownload, PlusCircle } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import type { Customer, Sale, Payment, CustomerWithSalesData } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { CartItem, SalesSession } from '@/app/(app)/sell/page';

interface CartPanelProps {
    cart: CartItem[];
    customers: Customer[];
    sales: Sale[];
    payments: Payment[];
    selectedCustomer: CustomerWithSalesData | null;
    onSelectCustomer: (customer: CustomerWithSalesData | null) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onClearCart: () => void;
    onFinalize: () => void;
    sessions: SalesSession[];
    activeSessionIndex: number;
    onSessionChange: (index: number) => void;
    onSessionAdd: () => void;
    onSessionClose: (index: number) => void;
}

export function CartPanel({
    cart,
    customers,
    sales,
    payments,
    selectedCustomer,
    onSelectCustomer,
    onUpdateQuantity,
    onClearCart,
    onFinalize,
    sessions,
    activeSessionIndex,
    onSessionChange,
    onSessionAdd,
    onSessionClose
}: CartPanelProps) {
    
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

    const handleSelectCustomer = (customerId: string) => {
        if (!customerId) {
            onSelectCustomer(null);
            return;
        }
        const customer = customersWithSales.find(c => c.id === customerId);
        onSelectCustomer(customer || null);
    }
    
    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    }, [cart]);

    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.cartQuantity, 0);
    }, [cart]);

    return (
        <div className="h-full flex flex-col">
            {/* Sessions Bar */}
            <div className="flex-shrink-0 flex items-center gap-2 mb-4 border-b pb-3">
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


            <Card className="w-full mb-4 flex-shrink-0">
                <CardHeader className="p-3 flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-5 w-5" /> Client
                    </CardTitle>
                    {selectedCustomer && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelectCustomer(null)}>
                            <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-3 pt-0">
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

            {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-muted/30 rounded-lg">
                    <HardDriveDownload className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold">Le panier est vide</h3>
                    <p className="text-muted-foreground">Ajoutez des produits pour commencer.</p>
                </div>
            ) : (
                <ScrollArea className="flex-1 h-full">
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
                </ScrollArea>
            )}
            
            <div className="flex-shrink-0 mt-4 border-t pt-4">
                 <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Articles</span>
                        <span>{totalItems}</span>
                    </div>
                     <div className="flex justify-between font-semibold text-xl">
                        <span>Total</span>
                        <span>{total.toFixed(2)} DA</span>
                    </div>
                 </div>
                 <div className="flex gap-2">
                     <Button variant="destructive" onClick={onClearCart} disabled={cart.length === 0} className="w-1/3">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                     <Button size="lg" onClick={onFinalize} disabled={cart.length === 0} className="flex-1 text-lg h-14">
                        <HardDriveDownload className="mr-2 h-5 w-5" />
                        VENTE (F4)
                    </Button>
                 </div>
            </div>
        </div>
    );
}
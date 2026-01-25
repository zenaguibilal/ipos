
'use client';
import type { Cart, Customer, CartItem } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, X, ShoppingCart } from 'lucide-react';
import { CustomerSelector } from './CustomerSelector';
import { CartItemControls } from './CartItemControls';
import { Input } from '../ui/input';

interface CartPanelProps {
    carts: Cart[];
    activeCartId: string;
    customers: Customer[];
    isLoading: boolean;
    onAddCart: () => void;
    onRemoveCart: (cartId: string) => void;
    onSwitchCart: (cartId: string) => void;
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
    onRemoveItem: (productId: string) => void;
    onClearCart: () => void;
    onSelectCustomer: (customerId: string | null) => void;
    onFinalize: () => void;
    onUpdateDiscount: (type: 'fixed' | 'percentage', value: number) => void;
    onAddNewCustomer: () => void;
}

export function CartPanel(props: CartPanelProps) {
    const activeCart = props.carts.find(c => c.id === props.activeCartId);
    if (!activeCart) return null;

    const subtotal = activeCart.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
    const discountAmount = activeCart.discount.type === 'fixed'
        ? activeCart.discount.value
        : (subtotal * activeCart.discount.value) / 100;
    const total = subtotal - discountAmount;

    return (
        <div className="md:col-span-1 xl:col-span-1 flex flex-col h-full bg-card border-l">
            <Tabs value={props.activeCartId} onValueChange={props.onSwitchCart} className="flex-shrink-0">
                <ScrollArea className="w-full">
                    <TabsList className="m-2">
                        {props.carts.map((cart) => (
                            <TabsTrigger key={cart.id} value={cart.id} className="relative pr-8">
                                {cart.name} ({cart.items.reduce((acc, item) => acc + item.cartQuantity, 0)})
                                {props.carts.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); props.onRemoveCart(cart.id); }} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </TabsTrigger>
                        ))}
                         <Button variant="ghost" size="icon" onClick={props.onAddCart} className="ml-1 h-8 w-8">
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </TabsList>
                </ScrollArea>
            </Tabs>
            
            <div className="p-4 border-t border-b">
                <CustomerSelector
                    customers={props.customers}
                    selectedCustomerId={activeCart.customerId}
                    onSelectCustomer={props.onSelectCustomer}
                    onAddNewCustomer={props.onAddNewCustomer}
                    isLoading={props.isLoading}
                />
            </div>

            <Card className="flex flex-col flex-grow m-4 mt-0 border-none shadow-none">
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xl">Panier</CardTitle>
                    <Button variant="ghost" size="sm" onClick={props.onClearCart} disabled={activeCart.items.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Vider
                    </Button>
                </CardHeader>
                
                <ScrollArea className="flex-grow">
                    <CardContent>
                        {activeCart.items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40">
                                <ShoppingCart className="h-10 w-10 mb-2" />
                                <p className="font-semibold">Le panier est vide</p>
                                <p className="text-sm">Ajoutez des produits pour commencer.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeCart.items.map(item => (
                                    <div key={item.id} className={`flex items-center gap-4 p-2 rounded-md ${item.flash ? 'animate-flash' : ''}`}>
                                        <div className="flex-grow">
                                            <p className="font-semibold truncate">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{(item.price * item.cartQuantity).toFixed(1)} DA</p>
                                        </div>
                                        <CartItemControls
                                            item={item}
                                            onUpdateQuantity={props.onUpdateQuantity}
                                            onRemoveItem={props.onRemoveItem}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>

                <CardFooter className="flex flex-col gap-4 border-t p-4 mt-auto">
                    <div className="w-full space-y-2">
                        <p className="text-sm font-medium">Remise sur le panier</p>
                        <div className="flex gap-2">
                            <Input 
                                type="number"
                                value={activeCart.discount.value}
                                onChange={(e) => props.onUpdateDiscount(activeCart.discount.type, parseFloat(e.target.value) || 0)}
                                className="h-9"
                            />
                            <div className="flex items-center rounded-md border">
                                <Button size="sm" variant={activeCart.discount.type === 'fixed' ? 'secondary' : 'ghost'} onClick={() => props.onUpdateDiscount('fixed', activeCart.discount.value)} className="rounded-r-none h-9">DA</Button>
                                <Button size="sm" variant={activeCart.discount.type === 'percentage' ? 'secondary' : 'ghost'} onClick={() => props.onUpdateDiscount('percentage', activeCart.discount.value)} className="rounded-l-none border-l h-9">%</Button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Sous-total</span>
                            <span>{subtotal.toFixed(1)} DA</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                            <span>Remise</span>
                            <span>-{discountAmount.toFixed(1)} DA</span>
                        </div>
                        <div className="flex justify-between font-bold text-2xl border-t pt-2 mt-2">
                            <span>TOTAL</span>
                            <span>{total.toFixed(1)} DA</span>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="w-full text-base"
                        onClick={props.onFinalize}
                        disabled={activeCart.items.length === 0}
                    >
                        VENTE <span className="text-muted-foreground ml-2 text-xs">(F4)</span>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

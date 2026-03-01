'use client';

import React, { useState } from 'react';
import { useCarts } from '@/hooks/useCarts';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { CartDisplay } from '@/components/sell/CartDisplay';
import { CartTabs } from '@/components/sell/CartTabs';
import { SaleActions } from '@/components/sell/SaleActions';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Search } from 'lucide-react';
import type { Product } from '@/lib/types';

export default function SellPage() {
    const {
        carts,
        activeCartId,
        setActiveCartId,
        addCart,
        removeCart,
        activeCart,
        clearCart,
        updateCartItemQuantity,
        removeCartItem,
        setCartCustomer,
        updateCart,
        setCartDiscount,
        isLoading
    } = useCarts();

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    if (isLoading || !activeCart) {
        return (
            <div className="flex h-full items-center justify-center">
                <p>Chargement des paniers...</p>
            </div>
        );
    }

    const handleProductSelected = (product: Product, quantity: number) => {
        updateCart(activeCartId, { product, quantity });
        setIsSearchOpen(false); // Close sheet after selection
    };
    
    return (
        <>
            <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <SheetContent side="left" className="p-0 w-full sm:max-w-md">
                    <ProductSearch onProductSelect={handleProductSelected} />
                </SheetContent>
            </Sheet>

            <div className="p-4 h-full">
                <div className="bg-card h-full flex flex-col p-4 border rounded-lg w-full max-w-2xl mx-auto">
                    <header className="mb-4">
                         <CartTabs
                            carts={carts}
                            activeCartId={activeCartId}
                            onTabChange={setActiveCartId}
                            onAddCart={addCart}
                            onRemoveCart={removeCart}
                        />
                    </header>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-grow">
                            <CustomerCombobox
                                customerId={activeCart.customerId}
                                onSelectCustomer={(customer) => setCartCustomer(customer)}
                            />
                        </div>
                        <Button variant="outline" onClick={() => setIsSearchOpen(true)}>
                            <Search className="mr-2 h-4 w-4" />
                            Produits
                        </Button>
                    </div>
                    
                    <CartDisplay
                        cart={activeCart}
                        onQuantityChange={updateCartItemQuantity}
                        onRemoveItem={removeCartItem}
                    />
                    
                    <footer className="mt-auto pt-4 border-t">
                        <SaleActions
                            cart={activeCart}
                            onClearCart={clearCart}
                            onSetDiscount={setCartDiscount!}
                        />
                    </footer>
                </div>
            </div>
        </>
    );
}

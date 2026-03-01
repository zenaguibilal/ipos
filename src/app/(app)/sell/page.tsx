'use client';

import React from 'react';
import { useCarts } from '@/hooks/useCarts';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { CartDisplay } from '@/components/sell/CartDisplay';
import { CartTabs } from '@/components/sell/CartTabs';
import { SaleActions } from '@/components/sell/SaleActions';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';

export default function SellPage() {
    const {
        carts,
        activeCartId,
        setActiveCartId,
        addCart,
        removeCart,
        updateCart,
        activeCart,
        clearCart,
        updateCartItemQuantity,
        removeCartItem,
        setCartCustomer,
    } = useCarts();

    if (!activeCart) {
        return (
            <div className="flex h-full items-center justify-center">
                <p>Chargement des paniers...</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full max-h-full overflow-hidden">
            {/* Left side - Product Search */}
            <div className="bg-background h-full flex flex-col">
                <ProductSearch onProductSelect={(product, quantity) => updateCart(activeCartId, { product, quantity })} />
            </div>

            {/* Right side - Cart and Actions */}
            <div className="bg-card h-full flex flex-col p-4 border-l">
                <header className="mb-4">
                     <CartTabs
                        carts={carts}
                        activeCartId={activeCartId}
                        onTabChange={setActiveCartId}
                        onAddCart={addCart}
                        onRemoveCart={removeCart}
                    />
                </header>

                <div className="mb-4">
                    <CustomerCombobox
                        customerId={activeCart.customerId}
                        onSelectCustomer={setCartCustomer}
                    />
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
                    />
                </footer>
            </div>
        </div>
    );
}

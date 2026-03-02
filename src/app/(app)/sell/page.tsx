'use client';

import { CartDisplay } from '@/components/sell/CartDisplay';
import { ProductSearch } from '@/components/sell/ProductSearch';
import { SaleActions } from '@/components/sell/SaleActions';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCarts } from '@/hooks/useCarts';
import { Button } from '@/components/ui/button';
import { CustomerCombobox } from '@/components/sell/CustomerCombobox';
import { CartTabs } from '@/components/sell/CartTabs';
import { PackageSearch } from 'lucide-react';
import { useState } from 'react';

export default function SellPage() {
    const {
        carts,
        activeCart,
        activeCartId,
        setActiveCartId,
        addCart,
        removeCart,
        addProductToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        setCartCustomer,
        setCartDiscount,
        isLoading,
    } = useCarts();
    const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);

    if (isLoading || !activeCart) {
        return (
            <div className="flex h-full items-center justify-center">
                <p>Chargement du panier...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                    <CartTabs
                        carts={carts}
                        activeCartId={activeCartId}
                        onTabChange={setActiveCartId}
                        onAddCart={addCart}
                        onRemoveCart={removeCart}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="w-full sm:w-64">
                         <CustomerCombobox
                            customerId={activeCart.customerId}
                            onSelectCustomer={setCartCustomer}
                        />
                    </div>
                    <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <PackageSearch className="mr-2 h-4 w-4" />
                                Produits
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-full max-w-full sm:max-w-md">
                            <ProductSearch 
                                onProductSelect={(product, quantity) => {
                                    addProductToCart(product, quantity);
                                    setIsProductSheetOpen(false);
                                }}
                            />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <Card className="flex-grow flex flex-col min-h-0">
                <CardContent className="p-6 flex-grow flex flex-col min-h-0">
                    <CartDisplay
                        cart={activeCart}
                        onQuantityChange={updateCartItemQuantity}
                        onRemoveItem={removeCartItem}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <SaleActions
                        cart={activeCart}
                        onClearCart={clearCart}
                        onSetDiscount={setCartDiscount}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

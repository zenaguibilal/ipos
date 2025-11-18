'use client';

import type { Product } from '@/lib/types';
import { useState } from 'react';
import Image from 'next/image';
import { PlusCircle, MinusCircle, XCircle, CreditCard, Wallet, Coins } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface CartItem extends Product {
  quantity: number;
}

export function POSClient({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };
  
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      {/* Product Selection */}
      <div className="md:col-span-2 bg-card rounded-lg border">
        <CardHeader>
            <CardTitle>Products</CardTitle>
        </CardHeader>
        <div className="p-4 h-[calc(100%-80px)] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
                <Card
                key={product.id}
                onClick={() => addToCart(product)}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                >
                <CardContent className="p-2 flex flex-col items-center justify-center">
                    <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={150}
                    height={150}
                    className="aspect-square object-cover rounded-md"
                    data-ai-hint={product.imageHint}
                    />
                    <h3 className="font-semibold text-sm mt-2 text-center">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">
                    {(product.price / 100).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    })}
                    </p>
                </CardContent>
                </Card>
            ))}
            </div>
        </div>
      </div>

      {/* Cart and Checkout */}
      <div className="md:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="rounded-md"
                      data-ai-hint={item.imageHint}
                    />
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.price / 100).toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                        <span>{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><XCircle className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col !items-stretch !p-0 border-t">
              <div className="p-6 space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{(subtotal / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
                 <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxes (8%)</span>
                    <span>{(tax / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
                <Separator />
                 <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{(total / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
                 <div className="pt-4">
                    <Label className="mb-2 block">Payment Method</Label>
                    <ToggleGroup type="single" defaultValue="cash" variant="outline" className="w-full justify-between">
                        <ToggleGroupItem value="cash" aria-label="Cash" className="flex-1">
                            <Coins className="h-4 w-4 mr-2"/> Cash
                        </ToggleGroupItem>
                        <ToggleGroupItem value="card" aria-label="Card" className="flex-1">
                            <CreditCard className="h-4 w-4 mr-2"/> Card
                        </ToggleGroupItem>
                         <ToggleGroupItem value="e-wallet" aria-label="E-Wallet" className="flex-1">
                            <Wallet className="h-4 w-4 mr-2"/> E-Wallet
                        </ToggleGroupItem>
                    </ToggleGroup>
                 </div>
              </div>
            <Button size="lg" className="w-full rounded-t-none rounded-b-lg text-lg" disabled={cart.length === 0}>
                Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

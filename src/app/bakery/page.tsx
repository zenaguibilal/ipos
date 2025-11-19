'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MinusCircle, PlusCircle, ShoppingCart, Cookie, Wheat } from 'lucide-react';
import { useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface BakeryItem {
  id: string;
  name: string;
  price: number; // in cents
  icon: React.ReactNode;
}

const bakeryItems: BakeryItem[] = [
  { id: 'bread', name: 'خبز', price: 1500, icon: <Wheat className="h-10 w-10 text-amber-600" /> },
  { id: 'meloui', name: 'ملوي', price: 5000, icon: <Cookie className="h-10 w-10 text-amber-800" /> },
];

interface CartItem extends BakeryItem {
  quantity: number;
}

export default function BakeryPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const firestore = useFirestore();
  const bakeryOrdersRef = useMemoFirebase(() => collection(firestore, 'bakery_orders'), [firestore]);

  const addToCart = (item: BakeryItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== itemId);
      }
      return prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'عربة فارغة',
        description: 'الرجاء إضافة عناصر إلى العربة قبل تقديم الطلب.',
      });
      return;
    }

    try {
      await addDocumentNonBlocking(bakeryOrdersRef, {
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, unitPrice: item.price })),
        totalAmount: total,
        orderDate: new Date().toISOString(),
        status: 'pending',
      });

      toast({
        title: 'تم تقديم الطلب!',
        description: 'تم تسجيل طلب المخبوزات بنجاح.',
      });
      setCart([]);
    } catch (error) {
      console.error("خطأ في تقديم الطلب: ", error);
      toast({
        variant: "destructive",
        title: "فشل تقديم الطلب",
        description: "حدث خطأ أثناء تسجيل طلبك. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <Card>
          <CardHeader>
            <CardTitle>قائمة المخبوزات</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bakeryItems.map((item) => (
              <Card
                key={item.id}
                className="flex flex-col items-center justify-center p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(item)}
              >
                {item.icon}
                <h3 className="text-lg font-semibold mt-2">{item.name}</h3>
                <p className="text-muted-foreground">
                  {(item.price / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'DZD',
                    minimumFractionDigits: 0,
                  })}
                </p>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart /> طلبك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">عربة الطلبات فارغة.</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(item.price / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex-col items-stretch gap-4 border-t pt-6">
              <div className="flex justify-between font-bold text-lg">
                <span>المجموع</span>
                <span>
                  {(total / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'DZD',
                    minimumFractionDigits: 0,
                  })}
                </span>
              </div>
              <Button size="lg" onClick={handlePlaceOrder}>تسجيل الطلب</Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

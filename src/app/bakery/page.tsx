'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, doc, orderBy, CollectionReference } from 'firebase/firestore';
import type { BakeryOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

type BakeryItemType = 'bread' | 'meloui';

function OrderForm({ type, onAddOrder }: { type: BakeryItemType, onAddOrder: (order: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled' >) => void }) {
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerName || quantity <= 0) {
      return;
    }
    onAddOrder({ customerName, quantity, type });
    setCustomerName('');
    setQuantity(1);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4 mb-6">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor={`customerName-${type}`}>اسم العميل</Label>
        <Input
          id={`customerName-${type}`}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="أدخل اسم العميل"
          required
        />
      </div>
      <div className="grid w-24 items-center gap-1.5">
        <Label htmlFor={`quantity-${type}`}>الكمية</Label>
        <Input
          id={`quantity-${type}`}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          min="1"
          required
        />
      </div>
      <Button type="submit" size="icon">
        <PlusCircle className="h-5 w-5" />
        <span className="sr-only">إضافة طلب</span>
      </Button>
    </form>
  );
}

function OrdersTable({ orders, onFulfill, onDelete }: { orders: BakeryOrder[], onFulfill: (id: string, isFulfilled: boolean) => void, onDelete: (id: string) => void }) {
    if (orders.length === 0) {
        return <p className="text-center text-muted-foreground">لا توجد طلبات حالية.</p>;
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">تم</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead>وقت الطلب</TableHead>
                    <TableHead className="text-right">إجراء</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.id} className={order.isFulfilled ? 'bg-muted/50 text-muted-foreground' : ''}>
                        <TableCell>
                            <Checkbox 
                                checked={order.isFulfilled} 
                                onCheckedChange={(checked) => onFulfill(order.id, !!checked)}
                            />
                        </TableCell>
                        <TableCell className={`font-medium ${order.isFulfilled ? 'line-through' : ''}`}>{order.customerName}</TableCell>
                        <TableCell className="text-center">{order.quantity}</TableCell>
                        <TableCell>{format(new Date(order.orderDate), 'HH:mm', { locale: fr })}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">حذف</span>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function BakeryTabContent({ type, bakeryOrdersColRef }: { type: BakeryItemType, bakeryOrdersColRef: CollectionReference | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const ordersQuery = useMemoFirebase(
        () => {
            if (!bakeryOrdersColRef) return null;
            return query(bakeryOrdersColRef, where('type', '==', type), orderBy('orderDate', 'desc'));
        },
        [bakeryOrdersColRef, type]
    );

    const { data: orders, isLoading } = useCollection<BakeryOrder>(ordersQuery);

    const handleAddOrder = (order: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'>) => {
        if (!bakeryOrdersColRef) return;
        const newOrder: Omit<BakeryOrder, 'id'> = {
            ...order,
            orderDate: new Date().toISOString(),
            isFulfilled: false,
        };
        addDocumentNonBlocking(bakeryOrdersColRef, newOrder);
        toast({
            title: "تمت إضافة الطلب",
            description: `تم تسجيل طلب ${order.customerName}.`,
        });
    };

    const handleFulfillOrder = (id: string, isFulfilled: boolean) => {
        const docRef = doc(firestore, 'bakery_orders', id);
        updateDocumentNonBlocking(docRef, { isFulfilled });
    };

    const handleDeleteOrder = (id: string) => {
        const docRef = doc(firestore, 'bakery_orders', id);
        deleteDocumentNonBlocking(docRef);
        toast({
            variant: 'destructive',
            title: "تم حذف الطلب",
        });
    };

    return (
        <Card>
            <CardHeader>
                <OrderForm type={type} onAddOrder={handleAddOrder} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader className="animate-spin" />
                    </div>
                ) : (
                    <OrdersTable 
                        orders={orders || []} 
                        onFulfill={handleFulfillOrder}
                        onDelete={handleDeleteOrder}
                    />
                )}
            </CardContent>
        </Card>
    );
}

export default function BakeryPage() {
    const firestore = useFirestore();
    const bakeryOrdersColRef = useMemoFirebase(() => collection(firestore, 'bakery_orders'), [firestore]);

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">طلبات المخبوزات</h1>
            </div>
            <Tabs defaultValue="bread" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bread">الخبز</TabsTrigger>
                    <TabsTrigger value="meloui">الملوي</TabsTrigger>
                </TabsList>
                <TabsContent value="bread">
                   <BakeryTabContent type="bread" bakeryOrdersColRef={bakeryOrdersColRef} />
                </TabsContent>
                <TabsContent value="meloui">
                   <BakeryTabContent type="meloui" bakeryOrdersColRef={bakeryOrdersColRef} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
    
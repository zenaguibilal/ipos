'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';
import type { BakeryOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader, PlusCircle, Trash2, Cookie, Wheat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

function BakeryOrderForm({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (order: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'>) => void }) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newOrder: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'> = {
            customerName: formData.get('customerName') as string,
            quantity: Number(formData.get('quantity')),
            type: formData.get('type') as 'bread' | 'meloui',
            paymentStatus: formData.get('paymentStatus') as 'paid' | 'unpaid',
        };
        onSave(newOrder);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إضافة طلب جديد</DialogTitle>
                    <DialogDescription>
                        أدخل تفاصيل الطلب الجديد.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="bakery-order-form" className="space-y-4">
                    <div>
                        <Label htmlFor="customerName">اسم العميل</Label>
                        <Input id="customerName" name="customerName" required />
                    </div>
                     <div>
                        <Label htmlFor="type">النوع</Label>
                        <Select name="type" defaultValue="bread">
                            <SelectTrigger>
                                <SelectValue placeholder="اختر النوع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bread">خبز</SelectItem>
                                <SelectItem value="meloui">ملوي</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input id="quantity" name="quantity" type="number" required min="1" />
                    </div>
                    <div>
                        <Label htmlFor="paymentStatus">حالة الدفع</Label>
                        <Select name="paymentStatus" defaultValue="unpaid">
                            <SelectTrigger>
                                <SelectValue placeholder="اختر حالة الدفع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">مدفوع</SelectItem>
                                <SelectItem value="unpaid">غير مدفوع</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>إلغاء</Button>
                    <Button type="submit" form="bakery-order-form">حفظ الطلب</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function BakeryTable({ orders, onFulfillToggle, onPaymentStatusChange, onDelete }: { orders: BakeryOrder[], onFulfillToggle: (order: BakeryOrder) => void, onPaymentStatusChange: (order: BakeryOrder, newStatus: 'paid' | 'unpaid') => void, onDelete: (orderId: string) => void }) {
    if (orders.length === 0) {
        return <p className="text-center text-muted-foreground py-8">لا توجد طلبات حالياً.</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>اسم العميل</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>حالة الدفع</TableHead>
                    <TableHead>حالة الاستلام</TableHead>
                    <TableHead>إجراءات</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.customerName}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>
                            <Badge variant={order.type === 'bread' ? 'secondary' : 'outline'}>
                                {order.type === 'bread' ? 'خبز' : 'ملوي'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Select
                                value={order.paymentStatus}
                                onValueChange={(newStatus: 'paid' | 'unpaid') => onPaymentStatusChange(order, newStatus)}
                            >
                                <SelectTrigger className={`w-[110px] ${order.paymentStatus === 'paid' ? 'border-green-500' : 'border-destructive'}`}>
                                    <SelectValue placeholder="حالة الدفع" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">مدفوع</SelectItem>
                                    <SelectItem value="unpaid">غير مدفوع</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id={`fulfill-switch-${order.id}`}
                                    checked={order.isFulfilled}
                                    onCheckedChange={() => onFulfillToggle(order)}
                                />
                                <Label htmlFor={`fulfill-switch-${order.id}`} className="sr-only">
                                    حالة الاستلام
                                </Label>
                            </div>
                        </TableCell>
                        <TableCell>
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

export default function BakeryPage() {
    const firestore = useFirestore();
    const bakeryOrdersColRef = useMemoFirebase(() => collection(firestore, 'bakery_orders'), [firestore]);
    const { data: orders, isLoading } = useCollection<BakeryOrder>(bakeryOrdersColRef);
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const breadOrdersCount = useMemo(() => {
        return orders?.filter(order => order.type === 'bread').length || 0;
    }, [orders]);

    const melouiOrdersCount = useMemo(() => {
        return orders?.filter(order => order.type === 'meloui').length || 0;
    }, [orders]);

    const handleSaveOrder = (orderData: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'>) => {
        const orderWithDate = {
            ...orderData,
            orderDate: new Date().toISOString(),
            isFulfilled: false,
        };
        addDocumentNonBlocking(bakeryOrdersColRef, orderWithDate);
        toast({
            title: "تم حفظ الطلب",
            description: `تم تسجيل طلب ${orderData.customerName} بنجاح.`,
        });
    };

    const handleFulfillToggle = async (order: BakeryOrder) => {
        const orderRef = doc(firestore, 'bakery_orders', order.id);
        try {
            await updateDoc(orderRef, { isFulfilled: !order.isFulfilled });
            toast({
                title: "تم تحديث الحالة",
                description: `تم تحديث حالة استلام طلب ${order.customerName}.`,
            });
        } catch (error) {
            console.error("Error updating fulfillment status:", error);
            toast({
                variant: "destructive",
                title: "خطأ في التحديث",
                description: "لم نتمكن من تحديث حالة الاستلام. يرجى المحاولة مرة أخرى.",
            });
        }
    };
    
    const handlePaymentStatusChange = async (order: BakeryOrder, newStatus: 'paid' | 'unpaid') => {
        const orderRef = doc(firestore, 'bakery_orders', order.id);
        try {
            await updateDoc(orderRef, { paymentStatus: newStatus });
            toast({
                title: "تم تحديث حالة الدفع",
                description: `تم تحديث حالة دفع طلب ${order.customerName}.`,
            });
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast({
                variant: "destructive",
                title: "خطأ في التحديث",
                description: "لم نتمكن من تحديث حالة الدفع. يرجى المحاولة مرة أخرى.",
            });
        }
    };

    const handleDeleteOrder = (orderId: string) => {
        const orderRef = doc(firestore, 'bakery_orders', orderId);
        deleteDocumentNonBlocking(orderRef);
        toast({
            title: "تم حذف الطلب",
            variant: "destructive",
        });
    };

    const sortedOrders = useMemo(() => {
        return orders ? [...orders].sort((a, b) => a.isFulfilled === b.isFulfilled ? (new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()) : a.isFulfilled ? 1 : -1) : [];
    }, [orders]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="grid gap-2">
                        <CardTitle>طلبات المخبوزات</CardTitle>
                        <CardDescription>إدارة وتتبع طلبات الخبز والملوي.</CardDescription>
                        <div className="flex items-center gap-4 pt-2">
                            <Badge variant="secondary" className="flex items-center gap-2">
                                <Wheat className="h-4 w-4" />
                                <span>خبز: {breadOrdersCount}</span>
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-2">
                                <Cookie className="h-4 w-4" />
                                <span>ملوي: {melouiOrdersCount}</span>
                            </Badge>
                        </div>
                    </div>
                    <Button size="sm" className="h-8 gap-1" onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة طلب</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader className="animate-spin" />
                        </div>
                    ) : (
                        <BakeryTable orders={sortedOrders} onFulfillToggle={handleFulfillToggle} onPaymentStatusChange={handlePaymentStatusChange} onDelete={handleDeleteOrder} />
                    )}
                </CardContent>
            </Card>
            <BakeryOrderForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveOrder} />
        </div>
    );
}

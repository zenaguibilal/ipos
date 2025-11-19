'use client';
import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function BakeryOrderForm({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (order: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'>) => Promise<void> }) {
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const newOrder: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'> = {
            customerName: formData.get('customerName') as string,
            quantity: Number(formData.get('quantity')),
            type: formData.get('type') as 'bread' | 'meloui',
            paymentStatus: formData.get('paymentStatus') as 'paid' | 'unpaid',
        };
        await onSave(newOrder);
        setIsSaving(false);
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
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>إلغاء</Button>
                    <Button type="submit" form="bakery-order-form" disabled={isSaving}>
                        {isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> جارٍ الحفظ...</> : 'حفظ الطلب'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


function BakeryTable({ orders, onFulfillToggle, onPaymentStatusChange, onDelete }: { orders: BakeryOrder[], onFulfillToggle: (order: BakeryOrder) => void, onPaymentStatusChange: (order: BakeryOrder, newStatus: 'paid' | 'unpaid') => void, onDelete: (orderId: string) => void }) {
    if (orders.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                    لا توجد طلبات حالياً.
                </TableCell>
            </TableRow>
        );
    }

    return (
        <>
            {orders.map(order => (
                <TableRow key={order.id} className={order.isFulfilled ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">{order.customerName}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell>
                         <Badge variant={order.type === 'bread' ? 'secondary' : 'outline'} className="gap-1">
                            {order.type === 'bread' ? <Wheat className="h-3 w-3" /> : <Cookie className="h-3 w-3" />}
                            {order.type === 'bread' ? 'خبز' : 'ملوي'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.orderDate), "d MMM yyyy, HH:mm", { locale: fr })}
                    </TableCell>
                    <TableCell>
                        <Select
                            value={order.paymentStatus}
                            onValueChange={(newStatus: 'paid' | 'unpaid') => onPaymentStatusChange(order, newStatus)}
                        >
                            <SelectTrigger className={`w-[110px] text-xs h-8 ${order.paymentStatus === 'paid' ? 'border-green-500 text-green-700 focus:ring-green-500' : 'border-red-500 text-red-700 focus:ring-red-500'}`}>
                                <SelectValue placeholder="حالة الدفع" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="paid">مدفوع</SelectItem>
                                <SelectItem value="unpaid">غير مدفوع</SelectItem>
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center justify-center">
                            <Switch
                                id={`fulfill-switch-${order.id}`}
                                checked={order.isFulfilled}
                                onCheckedChange={() => onFulfillToggle(order)}
                                aria-label="حالة الاستلام"
                            />
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">حذف</span>
                        </Button>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

export default function BakeryPage() {
    const firestore = useFirestore();
    const bakeryOrdersColRef = useMemoFirebase(() => collection(firestore, 'bakery_orders'), [firestore]);
    const { data: orders, isLoading } = useCollection<BakeryOrder>(bakeryOrdersColRef);
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const breadOrdersQuantity = useMemo(() => {
        return orders?.filter(order => order.type === 'bread' && !order.isFulfilled).reduce((sum, order) => sum + order.quantity, 0) || 0;
    }, [orders]);

    const melouiOrdersQuantity = useMemo(() => {
        return orders?.filter(order => order.type === 'meloui' && !order.isFulfilled).reduce((sum, order) => sum + order.quantity, 0) || 0;
    }, [orders]);

    const handleSaveOrder = async (orderData: Omit<BakeryOrder, 'id' | 'orderDate' | 'isFulfilled'>) => {
        if (!firestore) return;
        const orderWithDate = {
            ...orderData,
            orderDate: new Date().toISOString(),
            isFulfilled: false,
        };
        try {
            await addDoc(bakeryOrdersColRef, orderWithDate);
            toast({
                title: "تم حفظ الطلب",
                description: `تم تسجيل طلب ${orderData.customerName} بنجاح.`,
            });
            setIsFormOpen(false); // Close the dialog on successful save
        } catch (error) {
            console.error("Error saving order:", error);
            toast({
                variant: "destructive",
                title: "خطأ في الحفظ",
                description: "لم نتمكن من حفظ الطلب. يرجى المحاولة مرة أخرى.",
            });
        }
    };

    const handleFulfillToggle = async (order: BakeryOrder) => {
        if (!firestore) return;
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
        if (!firestore) return;
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

    const handleDeleteOrder = async (orderId: string) => {
        if (!firestore) return;
        if (!confirm('هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }
        const orderRef = doc(firestore, 'bakery_orders', orderId);
        try {
            await deleteDoc(orderRef);
            toast({
                title: "تم حذف الطلب",
            });
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                variant: "destructive",
                title: "خطأ في الحذف",
                description: "لم نتمكن من حذف الطلب. يرجى المحاولة مرة أخرى.",
            });
        }
    };

    const sortedOrders = useMemo(() => {
        return orders ? [...orders].sort((a, b) => {
            if (a.isFulfilled !== b.isFulfilled) {
                return a.isFulfilled ? 1 : -1;
            }
            return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        }) : [];
    }, [orders]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div className="grid gap-2">
                        <CardTitle>طلبات المخبوزات</CardTitle>
                        <CardDescription>إدارة وتتبع طلبات الخبز والملوي اليومية. الإجماليات تظهر فقط للطلبات غير المستلمة.</CardDescription>
                        <div className="flex items-center gap-4 pt-2">
                            <Badge variant="secondary" className="flex items-center gap-2 py-1 px-3 text-base">
                                <Wheat className="h-4 w-4" />
                                <span>خبز: {breadOrdersQuantity}</span>
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-2 py-1 px-3 text-base">
                                <Cookie className="h-4 w-4" />
                                <span>ملوي: {melouiOrdersQuantity}</span>
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
                        <div className="flex justify-center items-center h-60">
                            <Loader className="animate-spin h-8 w-8 text-primary" />
                        </div>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم العميل</TableHead>
                                    <TableHead className="text-center">الكمية</TableHead>
                                    <TableHead>النوع</TableHead>
                                    <TableHead>تاريخ الطلب</TableHead>
                                    <TableHead>حالة الدفع</TableHead>
                                    <TableHead className="text-center">حالة الاستلام</TableHead>
                                    <TableHead className="text-center">إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <BakeryTable 
                                    orders={sortedOrders} 
                                    onFulfillToggle={handleFulfillToggle} 
                                    onPaymentStatusChange={handlePaymentStatusChange} 
                                    onDelete={handleDeleteOrder} 
                                />
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <BakeryOrderForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveOrder} />
        </div>
    );
}
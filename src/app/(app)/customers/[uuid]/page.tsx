
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Printer, Loader2, Filter, History, ShoppingBag, TrendingUp, Info, Phone, MessageSquare, MapPin, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerMetrics } from '@/components/customers/CustomerMetrics';
import { CustomerActivity } from '@/components/customers/CustomerActivity';
import { useState, useCallback, useEffect } from 'react';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { SaleDetailsDialog } from '@/components/sales/SaleDetailsDialog';
import { ReturnDetailsDialog } from '@/components/returns/ReturnDetailsDialog';
import type { Sale, ProductReturn, Customer, CustomerTopProduct } from '@/lib/types';
import { PrintStatementDialog } from '@/components/customers/PrintStatementDialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { customerService } from '@/services/customer.service';
import { salesService } from '@/services/sales.service';
import { returnService } from '@/services/return.service';
import { toast } from 'sonner';
import { formatCurrency, getPlaceholder } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 15;

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerUuid = params.uuid as string;
    const companyProfile = useAppStore(state => state.profile);

    const [customer, setCustomer] = useState<Customer | undefined | null>(undefined);
    const [topProducts, setTopProducts] = useState<CustomerTopProduct[]>([]);
    const [financialSummary, setFinancialSummary] = useState<{ totalSalesCount: number, averageBasketValue: number } | null>(null);
    
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState<ProductReturn | null>(null);
    const [isReturnDetailsOpen, setIsReturnDetailsOpen] = useState(false);

    // States for activity pagination and filtering
    const [activity, setActivity] = useState<any[]>([]);
    const [activityPage, setActivityPage] = useState(1);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
    const [hasMoreActivity, setHasMoreActivity] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');

    const fetchCustomerData = useCallback(async () => {
        if (!customerUuid) {
            router.push('/customers');
            return;
        }
        try {
            const [cust, topProds, summary] = await Promise.all([
                customerService.getCustomerByUuid(customerUuid),
                customerService.getCustomerTopProducts(customerUuid),
                customerService.getCustomerFinancialSummary(customerUuid)
            ]);
            
            setCustomer(cust);
            setTopProducts(topProds);
            setFinancialSummary(summary);
            
            if (!cust) {
                toast.error("العميل غير موجود.");
            }
        } catch (error: any) {
            toast.error("فشل في تحميل بيانات العميل.", { description: error.message });
            setCustomer(null);
        }
    }, [customerUuid, router]);
    
    useEffect(() => {
        fetchCustomerData();
    },[fetchCustomerData]);

    // Fetch activity based on page and filter
    const fetchActivity = useCallback(async (page: number, type: string) => {
        if (!customerUuid) return;
        
        setIsLoadingActivity(true);
        try {
            const allActivity = await customerService.getCustomerActivity(customerUuid, 1, 1000); 
            
            let filtered = allActivity;
            if (type !== 'all') {
                filtered = allActivity.filter(a => a.type === type);
            }

            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const paginated = filtered.slice(0, startIndex + ITEMS_PER_PAGE);
            
            setActivity(paginated);
            setHasMoreActivity(paginated.length < filtered.length);
        } catch (error: any) {
            toast.error("فشل في تحميل سجل النشاطات.", { description: error.message });
        } finally {
            setIsLoadingActivity(false);
        }
    }, [customerUuid]);

    useEffect(() => {
        setActivityPage(1);
        fetchActivity(1, filterType);
    }, [customerUuid, filterType, fetchActivity]);

    const handleLoadMore = () => {
        if (!isLoadingActivity && hasMoreActivity) {
            const nextPage = activityPage + 1;
            setActivityPage(nextPage);
            fetchActivity(nextPage, filterType);
        }
    };

    const handleSuccessfulPayment = useCallback(async () => {
        toast.success("تم تسجيل الدفعة بنجاح.");
        await fetchCustomerData();
        setActivityPage(1);
        fetchActivity(1, filterType);
    }, [fetchCustomerData, fetchActivity, filterType]);

    const handleSaleClick = useCallback(async (sale: Sale) => {
        try {
            const saleWithItems = await salesService.getSaleByUuid(sale.uuid);
            if (!saleWithItems) {
                toast.error("تفاصيل الفاتورة غير موجودة.");
                return;
            }
            setSelectedSale(saleWithItems);
            setIsSaleDetailsOpen(true);
        } catch (error: any) {
            toast.error("فشل في تحميل تفاصيل المبيعات.");
        }
    }, []);

    const handleReturnClick = useCallback(async (pr: ProductReturn) => {
        try {
            const returnWithItems = await returnService.getReturnByUuid(pr.uuid);
             if (!returnWithItems) {
                toast.error("تفاصيل المرتجع غير موجودة.");
                return;
            }
            setSelectedReturn(returnWithItems);
            setIsReturnDetailsOpen(true);
        } catch (error: any) {
            toast.error("فشل في تحميل تفاصيل المرتجع.");
        }
    }, []);

    const handleWhatsAppReminder = () => {
        if (!customer?.phone) {
            toast.error("رقم الهاتف مفقود لهذا العميل.");
            return;
        }
        const storeName = companyProfile?.companyName || "متجر iPOS";
        const amount = customer.outstandingBalance;
        const message = `مرحباً ${customer.firstName}، نود تذكيركم بأن الرصيد المتبقي لديكم في ${storeName} هو ${amount.toFixed(1)} د.ج. شكراً لتعاملكم معنا.`;
        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (customer === undefined) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-80 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-60 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!customer) {
        return (
            <div className="p-4 sm:p-6 text-center">
                <h1 className="text-xl font-bold">العميل غير موجود</h1>
                <Button asChild variant="link" className="mt-4">
                    <Link href="/customers">العودة لقائمة العملاء</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
                 </Button>
                 <PageHeader 
                    title={`${customer.firstName} ${customer.lastName}`}
                    description={`معرف العميل: ${customer.uuid.substring(0,8)}...`}
                 >
                    <Badge variant="secondary" className="px-3 py-1">
                        <Tag className="mr-2 h-3 w-3" />
                        {customer.category || 'عميل عادي'}
                    </Badge>
                 </PageHeader>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="bg-primary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-primary" />
                                    عدد المشتريات
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black">{financialSummary?.totalSalesCount || 0}</p>
                                <p className="text-xs text-muted-foreground">عملية مسجلة</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-chart-quaternary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-chart-quaternary" />
                                    متوسط السلة
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-black text-chart-quaternary">{formatCurrency(financialSummary?.averageBasketValue || 0)}</p>
                                <p className="text-xs text-muted-foreground">متوسط قيمة الزيارة</p>
                            </CardContent>
                        </Card>
                    </div>

                    {customer.notes && (
                        <Card className="border-l-4 border-l-primary bg-primary/5">
                            <CardHeader className="py-3">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    ملاحظات وتنبيهات
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    سجل النشاطات
                                </CardTitle>
                                <CardDescription>
                                    تتبع جميع العمليات المالية للعميل.
                                </CardDescription>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Filter className="mr-2 h-4 w-4" />
                                        تصفية: {filterType === 'all' ? 'الكل' : filterType === 'sale' ? 'مبيعات' : filterType === 'payment' ? 'مدفوعات' : 'مرتجعات'}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>نوع العملية</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem checked={filterType === 'all'} onCheckedChange={() => setFilterType('all')}>عرض الكل</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'sale'} onCheckedChange={() => setFilterType('sale')}>المبيعات فقط</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'payment'} onCheckedChange={() => setFilterType('payment')}>المدفوعات فقط</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={filterType === 'return'} onCheckedChange={() => setFilterType('return')}>المرتجعات فقط</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent>
                           {isLoadingActivity && activity.length === 0 ? (
                                <div className="flex justify-center items-center h-60">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <CustomerActivity 
                                    activity={activity} 
                                    onSaleClick={handleSaleClick}
                                    onReturnClick={handleReturnClick}
                                />
                            )}
                        </CardContent>
                        {hasMoreActivity && (
                            <CardFooter>
                                <Button onClick={handleLoadMore} className="w-full" variant="ghost" disabled={isLoadingActivity}>
                                    {isLoadingActivity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    تحميل المزيد
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
                <div className="space-y-6">
                    <CustomerMetrics customer={customer} />
                    <div className="grid grid-cols-2 gap-2">
                        <Button 
                            size="lg" 
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsStatementDialogOpen(true)}
                        >
                            <Printer className="mr-2 h-5 w-5" /> كشف حساب
                        </Button>
                        <Button 
                            size="lg" 
                            className="w-full"
                            onClick={() => setIsPaymentDialogOpen(true)}
                            disabled={customer.outstandingBalance <= 0}
                        >
                            <HandCoins className="mr-2 h-5 w-5" /> قبض دفعة
                        </Button>
                    </div>

                    {customer.outstandingBalance > 0 && (
                        <Button 
                            variant="secondary" 
                            className="w-full bg-green-600 hover:bg-green-700 text-white" 
                            onClick={handleWhatsAppReminder}
                        >
                            <MessageSquare className="mr-2 h-5 w-5" /> تذكير عبر واتساب
                        </Button>
                    )}
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                الأصناف الأكثر شراءً
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {topProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {topProducts.map((p) => (
                                        <div key={p.productUuid} className="flex items-center justify-between gap-3 border-b border-muted last:border-0 pb-2 last:pb-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 relative flex-shrink-0 bg-muted rounded overflow-hidden">
                                                    <Image 
                                                        src={getPlaceholder().url} 
                                                        alt={p.name} 
                                                        fill 
                                                        className="object-cover"
                                                        data-ai-hint="product item"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate" title={p.name}>{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.quantity} وحدة</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-primary">{formatCurrency(p.totalAmount)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات أصناف.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">معلومات الاتصال</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm pt-2">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-3.5 w-3.5"/> الهاتف</span>
                                    <div className="flex gap-2">
                                        <span className="font-medium">{customer.phone || 'N/A'}</span>
                                        {customer.phone && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" asChild>
                                                <a href={`tel:${customer.phone}`}><Phone className="h-3 w-3" /></a>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-3.5 w-3.5"/> العنوان</span>
                                    <span className="font-medium text-right max-w-[150px] truncate">{customer.address || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between border-t pt-3">
                                    <span className="text-muted-foreground">تاريخ الانضمام:</span>
                                    <span className="font-medium">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ar-DZ') : 'N/A'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            
             {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={handleSuccessfulPayment}
                />
            )}

            <PrintStatementDialog
                isOpen={isStatementDialogOpen}
                onOpenChange={setIsStatementDialogOpen}
                customer={customer}
            />

            <SaleDetailsDialog
                isOpen={isSaleDetailsOpen}
                onOpenChange={setIsSaleDetailsOpen}
                sale={selectedSale}
            />
            <ReturnDetailsDialog
                isOpen={isReturnDetailsOpen}
                onOpenChange={setIsReturnDetailsOpen}
                productReturn={selectedReturn}
            />
        </div>
    );
}

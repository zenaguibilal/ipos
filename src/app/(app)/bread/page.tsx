'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, doc, writeBatch, serverTimestamp, WriteBatch } from 'firebase/firestore';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BreadCustomer, DailyBreadOrder, BreadOrder, CompanyProfile, Sale } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PlusCircle, ArrowLeft, ArrowRight, CalendarIcon, Users, GitMerge, FileText, Receipt, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BreadCustomerDialog } from '@/components/bread/bread-customer-dialog';
import { DeleteBreadCustomerDialog } from '@/components/bread/delete-bread-customer-dialog';
import { SetOrderDialog } from '@/components/bread/set-order-dialog';
import { BreadOrderCard } from '@/components/bread/bread-order-card';
import { BreadOrderCardSkeleton } from '@/components/bread/bread-order-card-skeleton';
import { toast } from 'sonner';

export default function BreadPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isSetOrderDialogOpen, setIsSetOrderDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<BreadCustomer | null>(null);
    const [customerToEdit, setCustomerToEdit] = useState<BreadCustomer | null>(null);
    const [orderToEdit, setOrderToEdit] = useState<BreadOrder | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // --- Data Fetching ---
    const customersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'breadCustomers'), orderBy('name', 'asc')) : null, [user, firestore]);
    const ordersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'dailyBreadOrders'), where('date', '==', dateKey)) : null, [user, firestore, dateKey]);
    const companyProfileRef = useMemoFirebase(() => (user && firestore) ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);
    
    const { data: breadCustomers, isLoading: isLoadingCustomers } = useCollection<BreadCustomer>(customersQuery);
    const { data: dailyOrders, isLoading: isLoadingOrders } = useCollection<DailyBreadOrder>(ordersQuery);
    const { data: companyProfile, isLoading: isCompanyProfileLoading } = useDoc<CompanyProfile>(companyProfileRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const breadOrders = useMemo<BreadOrder[]>(() => {
        if (!breadCustomers) return [];

        const ordersMap = new Map(dailyOrders?.map(order => [order.breadCustomerId, order]));

        return breadCustomers.map(customer => ({
            ...customer,
            todaysOrder: ordersMap.get(customer.id) ? {
                id: ordersMap.get(customer.id)!.id,
                quantity: ordersMap.get(customer.id)!.quantity,
                isRecurring: ordersMap.get(customer.id)!.isRecurring,
                saleId: ordersMap.get(customer.id)!.saleId,
            } : undefined
        }));
    }, [breadCustomers, dailyOrders]);

    const { activeBreadOrders, inactiveBreadOrders } = useMemo(() => {
        const active: BreadOrder[] = [];
        const inactive: BreadOrder[] = [];
        breadOrders.forEach(order => {
            if (order.isActive) {
                active.push(order);
            } else {
                inactive.push(order);
            }
        });
        return { activeBreadOrders: active, inactiveBreadOrders: inactive };
    }, [breadOrders]);


    const handleAddCustomer = () => {
        setCustomerToEdit(null);
        setIsCustomerDialogOpen(true);
    };

    const handleEditCustomer = (customer: BreadCustomer) => {
        setCustomerToEdit(customer);
        setIsCustomerDialogOpen(true);
    };

    const handleSetOrder = (order: BreadOrder) => {
        setOrderToEdit(order);
        setIsSetOrderDialogOpen(true);
    };
    
    const { totalQuantity, totalRevenue, processableOrdersCount, generatedSalesCount } = useMemo(() => {
        const price = companyProfile?.breadPrice ?? 0;
        let quantity = 0;
        let processable = 0;
        let generated = 0;

        for (const order of activeBreadOrders) {
            const orderQuantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
            quantity += orderQuantity;

            if (orderQuantity > 0) {
                 if (order.todaysOrder?.saleId) {
                    generated++;
                } else {
                    processable++;
                }
            }
        }
        return { 
            totalQuantity: quantity, 
            totalRevenue: quantity * price,
            processableOrdersCount: processable,
            generatedSalesCount: generated,
        };
    }, [activeBreadOrders, companyProfile]);

    const addSaleToBatch = (batch: WriteBatch, order: BreadOrder) => {
        if (!firestore || !user || !companyProfile?.breadPrice) {
           throw new Error("Veuillez définir un prix pour le pain dans votre profil d'entreprise.");
       }
       const quantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;

       const breadPrice = companyProfile.breadPrice;
       const breadProductId = 'BREAD_PRODUCT_ID';
       const total = quantity * breadPrice;

       const newSaleRef = doc(collection(firestore, 'users', user.uid, 'sales'));
       const saleData: Omit<Sale, 'id' | 'createdAt'> = {
           invoiceNumber: `PAIN-${dateKey}-${order.id.slice(0, 5)}`,
           items: [{
               id: breadProductId,
               name: 'Pain',
               price: breadPrice,
               purchasePrice: 0,
               quantity: quantity,
           }],
           subtotal: total,
           total: total,
           amountPaid: 0,
           remainingBalance: total,
           paymentStatus: 'unpaid',
           payments: [],
           customerId: order.id,
           customerName: order.name,
       };
       batch.set(newSaleRef, { ...saleData, createdAt: serverTimestamp() });
       
       if (order.todaysOrder?.id) {
           const dailyOrderRef = doc(firestore, 'users', user.uid, 'dailyBreadOrders', order.todaysOrder.id);
           batch.update(dailyOrderRef, { saleId: newSaleRef.id });
       } else {
           const newDailyOrderRef = doc(collection(firestore, 'users', user.uid, 'dailyBreadOrders'));
           batch.set(newDailyOrderRef, {
               breadCustomerId: order.id,
               customerName: order.name,
               quantity: quantity,
               date: dateKey,
               isRecurring: true,
               createdAt: serverTimestamp(),
               saleId: newSaleRef.id,
           });
       }
   }

   const handleGenerateSingleSale = async (order: BreadOrder) => {
        setProcessingOrderId(order.id);
       toast.info(`Génération de la vente pour ${order.name}...`);
       try {
           if (!firestore) throw new Error("Firestore not available");
           const quantity = order.todaysOrder?.quantity ?? order.defaultOrderQuantity;
           if (quantity <= 0) throw new Error("La quantité est de 0.");
           if (order.todaysOrder?.saleId) throw new Error("Vente déjà générée.");

           const batch = writeBatch(firestore);
           addSaleToBatch(batch, order);
           await batch.commit();
           toast.success(`Vente pour ${order.name} générée avec succès !`);
       } catch (error: any) {
            console.error("Failed to generate single bread sale:", error);
           toast.error(error.message || "Une erreur est survenue lors de la génération de la vente.");
       } finally {
            setProcessingOrderId(null);
       }
   }

    const handleGenerateAllSales = async () => {
        if (!firestore) return;
        const ordersToProcess = activeBreadOrders.filter(o => {
            const quantity = o.todaysOrder?.quantity ?? o.defaultOrderQuantity;
            return !o.todaysOrder?.saleId && quantity > 0;
        });

        if (ordersToProcess.length === 0) {
            toast.info("Aucune nouvelle vente à générer pour aujourd'hui.");
            return;
        }

        setIsProcessing(true);
        toast.info(`Génération de ${ordersToProcess.length} vente(s) en cours...`);

        try {
            const batch = writeBatch(firestore);
            for (const order of ordersToProcess) {
                addSaleToBatch(batch, order);
            }
            await batch.commit();
            toast.success(`${ordersToProcess.length} vente(s) générée(s) avec succès !`);

        } catch (error: any) {
            console.error("Failed to generate bread sales:", error);
            toast.error(error.message || "Une erreur est survenue lors de la génération des ventes.");
        } finally {
            setIsProcessing(false);
        }
    };

    const isLoading = isUserLoading || isLoadingCustomers || isLoadingOrders || isCompanyProfileLoading;

    if (!user && !isLoading) {
        return null;
    }

    return (
        <>
            {user && (
                <BreadCustomerDialog
                    isOpen={isCustomerDialogOpen}
                    onOpenChange={setIsCustomerDialogOpen}
                    customer={customerToEdit}
                    userId={user.uid}
                />
            )}
            {user && (
                <DeleteBreadCustomerDialog
                    isOpen={!!customerToDelete}
                    onOpenChange={() => setCustomerToDelete(null)}
                    customer={customerToDelete}
                    userId={user.uid}
                />
            )}
             {user && orderToEdit && (
                <SetOrderDialog
                    isOpen={isSetOrderDialogOpen}
                    onOpenChange={setIsSetOrderDialogOpen}
                    order={orderToEdit}
                    date={selectedDate}
                    userId={user.uid}
                />
            )}

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Commandes de Pain</h1>
                        <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes et générez les ventes associées.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={handleGenerateAllSales} disabled={isProcessing || !!processingOrderId || processableOrdersCount === 0}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Receipt className="mr-2 h-4 w-4" />}
                            Générer {processableOrdersCount > 0 ? `${processableOrdersCount} ` : ''}Vente(s)
                        </Button>
                        <Button onClick={handleAddCustomer}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un client
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeBreadOrders.length ?? 0}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pains du Jour (Actifs)</CardTitle>
                            <GitMerge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalQuantity}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenu Estimé (Actifs)</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} DA</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ventes Générées</CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{generatedSalesCount}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(selectedDate, 'eeee, d MMMM yyyy', { locale: fr })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        initialFocus
                                        locale={fr}
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button variant="outline" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <BreadOrderCardSkeleton key={i} />)}
                            </div>
                        ) : breadOrders.length === 0 ? (
                            <div className="flex h-40 items-center justify-center">
                                <p className="text-muted-foreground">Aucun client de pain trouvé.</p>
                            </div>
                        ) : (
                             <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {activeBreadOrders.map(order => (
                                        <BreadOrderCard
                                            key={order.id}
                                            order={order}
                                            onEditCustomer={handleEditCustomer}
                                            onDeleteCustomer={setCustomerToDelete}
                                            onSetOrder={handleSetOrder}
                                            onGenerateSale={handleGenerateSingleSale}
                                            isProcessing={processingOrderId === order.id}
                                            isGloballyProcessing={isProcessing}
                                        />
                                    ))}
                                </div>

                                {inactiveBreadOrders.length > 0 && (
                                    <>
                                        <div className="my-8">
                                            <h3 className="text-lg font-semibold text-muted-foreground">Clients Inactifs</h3>
                                            <div className="mt-2 border-b"></div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {inactiveBreadOrders.map(order => (
                                                <BreadOrderCard
                                                    key={order.id}
                                                    order={order}
                                                    onEditCustomer={handleEditCustomer}
                                                    onDeleteCustomer={setCustomerToDelete}
                                                    onSetOrder={handleSetOrder}
                                                    onGenerateSale={handleGenerateSingleSale}
                                                    isProcessing={processingOrderId === order.id}
                                                    isGloballyProcessing={isProcessing}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                             </>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

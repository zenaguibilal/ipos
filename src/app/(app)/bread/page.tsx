
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { BreadCustomer, DailyBreadOrder, BreadOrder, CompanyProfile } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, ArrowLeft, ArrowRight, CalendarIcon, Users, GitMerge, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BreadCustomerDialog } from '@/components/bread/bread-customer-dialog';
import { DeleteBreadCustomerDialog } from '@/components/bread/delete-bread-customer-dialog';
import { SetOrderDialog } from '@/components/bread/set-order-dialog';
import { BreadOrderCard } from '@/components/bread/bread-order-card';
import { BreadOrderCardSkeleton } from '@/components/bread/bread-order-card-skeleton';

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

    const dateKey = format(selectedDate, 'yyyy-MM-dd');

    // --- Data Fetching ---
    const customersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'breadCustomers'), orderBy('name', 'asc')) : null, [user, firestore]);
    const ordersQuery = useMemoFirebase(() => (user && firestore) ? query(collection(firestore, 'users', user.uid, 'dailyBreadOrders'), where('date', '==', dateKey)) : null, [user, firestore, dateKey]);
    const companyProfileRef = useMemoFirebase(() => (user && firestore) ? collection(firestore, 'users', user.uid, 'companyProfile') : null, [user, firestore]);
    const { data: companyProfile, isLoading: isCompanyProfileLoading } = useDoc<CompanyProfile>(companyProfileRef ? companyProfileRef.docs[0]?.ref : null);

    const { data: breadCustomers, isLoading: isLoadingCustomers } = useCollection<BreadCustomer>(customersQuery);
    const { data: dailyOrders, isLoading: isLoadingOrders } = useCollection<DailyBreadOrder>(ordersQuery);

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
            } : undefined
        }));
    }, [breadCustomers, dailyOrders]);

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
    
    const { totalQuantity, totalRevenue } = useMemo(() => {
        const price = companyProfile?.breadPrice ?? 0;
        const total = breadOrders.reduce((sum, order) => {
            return sum + (order.todaysOrder?.quantity ?? order.defaultOrderQuantity);
        }, 0);
        return { totalQuantity: total, totalRevenue: total * price };
    }, [breadOrders, companyProfile]);

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
                        <p className="text-muted-foreground">Gérez les commandes de pain quotidiennes de vos clients.</p>
                    </div>
                     <div className="flex items-center gap-2">
                        <Button onClick={handleAddCustomer}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un client
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clients (Pain)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{breadCustomers?.length ?? 0}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Pains (Aujourd'hui)</CardTitle>
                            <GitMerge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalQuantity}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenu Estimé (Aujourd'hui)</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} DA</div>
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
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {breadOrders.map(order => (
                                    <BreadOrderCard
                                        key={order.id}
                                        order={order}
                                        onEditCustomer={handleEditCustomer}
                                        onDeleteCustomer={setCustomerToDelete}
                                        onSetOrder={handleSetOrder}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

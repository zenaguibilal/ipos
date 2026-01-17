'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Phone, Trash2, Edit, FileText, HandCoins } from 'lucide-react';
import Link from 'next/link';

import { AddPaymentForm } from '@/components/customers/add-payment-form';
import { EditCustomerForm } from '@/components/customers/edit-customer-form';
import { DeleteCustomerDialog } from '@/components/customers/delete-customer-dialog';
import { CustomerHistory } from '@/components/customers/customer-history';
import { CustomerStats } from '@/components/customers/customer-stats';
import { SaleDetailsDialog } from '@/components/sales/sale-details-dialog';

import type { Customer, Sale, Payment, CompanyProfile } from '@/lib/types';
import { safeToDate } from '@/lib/utils';


export default function CustomerDetailPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const customerId = params.id as string;

    // --- Component State ---
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    // --- Data Fetching ---
    const customerDocRef = useMemoFirebase(() => 
        (user && firestore) ? doc(firestore, 'users', user.uid, 'customers', customerId) : null,
    [user, firestore, customerId]);
    
    // Fetch all sales and payments, then filter client-side.
    // This avoids the need for a composite index on (customerId, createdAt).
    const allSalesCollectionRef = useMemoFirebase(() => 
        (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null, 
    [user, firestore]);

    const allPaymentsCollectionRef = useMemoFirebase(() => 
        (user && firestore) ? collection(firestore, 'users', user.uid, 'payments') : null, 
    [user, firestore]);

    const companyDocRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'companyProfile', 'main') : null, [user, firestore]);

    const { data: customer, isLoading: isLoadingCustomer } = useDoc<Customer>(customerDocRef);
    const { data: allSales, isLoading: isLoadingSales } = useCollection<Sale>(allSalesCollectionRef);
    const { data: allPayments, isLoading: isLoadingPayments } = useCollection<Payment>(allPaymentsCollectionRef);
    const { data: companyProfile, isLoading: isLoadingCompany } = useDoc<CompanyProfile>(companyDocRef);

    // Memoized client-side filtering
    const { customerSales, customerPayments } = useMemo(() => {
        if (!customerId) return { customerSales: [], customerPayments: [] };
        const sales = (allSales || []).filter(s => s.customerId === customerId);
        const payments = (allPayments || []).filter(p => p.customerId === customerId);
        return { customerSales: sales, customerPayments: payments };
    }, [allSales, allPayments, customerId]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const { totalSpent, totalPaid, outstandingBalance, lastActivityDate } = useMemo(() => {
        const sales = customerSales;
        const payments = customerPayments;
        
        const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalPaidWithinSales = sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
        const totalStandalonePayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        const totalPaidAmount = totalPaidWithinSales + totalStandalonePayments;
        const balance = totalSalesAmount - totalPaidAmount;

        const allTransactions = [...(sales || []), ...(payments || [])];
        const validTimestamps = allTransactions
            .map(t => t.createdAt)
            .filter(Boolean) // Filter out null/undefined timestamps
            .map(ts => safeToDate(ts).getTime());

        const lastActivity = validTimestamps.length > 0 
            ? new Date(Math.max(...validTimestamps)) 
            : null;

        return { 
            totalSpent: totalSalesAmount, 
            totalPaid: totalPaidAmount,
            outstandingBalance: balance < 0.01 ? 0 : balance,
            lastActivityDate: lastActivity
        };
    }, [customerSales, customerPayments]);

    const isLoading = isUserLoading || isLoadingCustomer || isLoadingSales || isLoadingPayments || isLoadingCompany;

    if (isLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement du profil client...</p></div>;
    }

    if (!customer && !isLoading) {
        return (
             <div className="flex flex-col h-full items-center justify-center gap-4">
                <p>Client non trouvé.</p>
                <Button asChild variant="outline">
                    <Link href="/customers">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à la liste des clients
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            {customer && (
                <>
                    <AddPaymentForm
                        isOpen={isAddingPayment}
                        onOpenChange={setIsAddingPayment}
                        userId={user.uid}
                        customer={customer}
                    />
                    <EditCustomerForm
                        isOpen={isEditing}
                        onOpenChange={setIsEditing}
                        userId={user.uid}
                        customer={customer}
                    />
                    <DeleteCustomerDialog
                        isOpen={isDeleting}
                        onOpenChange={setIsDeleting}
                        customerName={`${customer.firstName} ${customer.lastName}`}
                        onConfirm={() => {
                            // The deletion logic will be inside the component
                            // We just need to navigate away on success
                        }}
                        customerId={customer.id}
                        userId={user.uid}
                    />
                </>
            )}
             {selectedSale && (
                <SaleDetailsDialog
                    isOpen={true}
                    onOpenChange={(isOpen) => !isOpen && setSelectedSale(null)}
                    sale={selectedSale}
                    companyProfile={companyProfile}
                    customer={customer}
                />
            )}

            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour à la liste
                        </Link>
                    </Button>
                </div>
                
                {customer && (
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-3 text-2xl">
                                        <User className="h-6 w-6"/>
                                        {customer.firstName} {customer.lastName}
                                    </CardTitle>
                                    {customer.phone && (
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                             <Phone className="h-4 w-4"/>
                                            {customer.phone}
                                        </CardDescription>
                                    )}
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" onClick={() => setIsAddingPayment(true)} className="flex-1 sm:flex-initial">
                                        <HandCoins className="mr-2 h-4 w-4"/>
                                        Encaisser un paiement
                                    </Button>
                                    <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                         <Edit className="mr-2 h-4 w-4"/>
                                        Modifier
                                    </Button>
                                     <Button variant="destructive" onClick={() => setIsDeleting(true)}>
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Supprimer
                                    </Button>
                                </div>
                            </CardHeader>
                        </Card>

                        <CustomerStats 
                            totalSpent={totalSpent}
                            outstandingBalance={outstandingBalance}
                            lastActivityDate={lastActivityDate}
                        />

                        <CustomerHistory 
                            sales={customerSales || []}
                            payments={customerPayments || []}
                            isLoading={isLoadingSales || isLoadingPayments}
                            onViewSale={setSelectedSale}
                        />
                    </div>
                )}
            </main>
        </>
    );
}

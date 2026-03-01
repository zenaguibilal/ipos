'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Phone } from 'lucide-react';
import Link from 'next/link';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Customer } from '@/lib/types';
import { CustomerDialog } from '@/components/customers/customer-dialog';


export default function CustomerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const customerId = parseInt(params.id as string, 10);

    const [isEditOpen, setIsEditOpen] = useState(false);

    const customer = useLiveQuery(() => db.customers.get(customerId), [customerId]);

    const isLoading = customer === undefined;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><p>Chargement du profil client...</p></div>;
    }

    if (!customer) {
        return (
             <div className="flex h-full items-center justify-center">
                 <div className="text-center">
                     <p className="text-xl font-semibold">Client non trouvé</p>
                     <p className="text-muted-foreground">Ce client n'existe pas ou a été supprimé.</p>
                     <Button asChild className="mt-4">
                         <Link href="/customers">Retour à la liste des clients</Link>
                     </Button>
                 </div>
            </div>
        );
    }

    return (
        <>
            {customer && (
                 <CustomerDialog
                    isOpen={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    customer={customer}
                />
            )}
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                <div className="mb-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/customers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour aux clients
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">{customer.firstName} {customer.lastName}</CardTitle>
                                {customer.phone && (
                                     <CardDescription className="flex items-center gap-2 pt-2">
                                        <Phone className="h-4 w-4" /> {customer.phone}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                 <Button variant="secondary" onClick={() => setIsEditOpen(true)} className="w-full">
                                    <Edit className="mr-2 h-4 w-4"/> Modifier
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Client depuis</span>
                                    <span className="font-semibold">{customer.createdAt ? format(safeToDate(customer.createdAt), 'd MMM yyyy', { locale: fr }) : 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                             <CardHeader>
                                <CardTitle>Activité du Client</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">L'historique des activités n'est plus disponible.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    )
}

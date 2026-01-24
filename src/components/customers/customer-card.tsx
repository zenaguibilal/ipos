'use client';

import type { Customer, CustomerWithSalesData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, HandCoins, FileText, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomerCardProps {
    customer: CustomerWithSalesData;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onAddPayment: (customer: Customer) => void;
}

export function CustomerCard({ customer, onEdit, onDelete, onAddPayment }: CustomerCardProps) {
    return (
        <Card className="flex flex-col transition-shadow duration-300 hover:shadow-xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">
                            <Link href={`/customers/${customer.id}`} className="hover:underline">
                                {customer.firstName} {customer.lastName}
                            </Link>
                        </CardTitle>
                         {customer.phone && (
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{customer.phone}</span>
                            </div>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/${customer.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Voir les détails
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAddPayment(customer)}>
                                <HandCoins className="mr-2 h-4 w-4" />
                                Encaisser un paiement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="flex justify-between items-center bg-destructive/10 text-destructive p-3 rounded-lg">
                    <span className="font-semibold">Dette</span>
                    <span className="text-xl font-bold">{customer.outstandingBalance.toFixed(1)} DA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total Dépensé</span>
                    <span className="font-semibold">{customer.totalSpent.toFixed(1)} DA</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Dernière Activité</span>
                    <span className="font-semibold">
                        {customer.lastActivityDate ? format(customer.lastActivityDate, 'd MMM yyyy', { locale: fr }) : 'N/A'}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                 {customer.isReminderDue && (
                    <div className="text-xs text-destructive flex items-center gap-1 w-full justify-center bg-destructive/10 p-2 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span>La date de règlement est dépassée.</span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}

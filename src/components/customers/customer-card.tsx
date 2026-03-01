'use client';

import React from 'react';
import type { CustomerWithSalesData } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, BarChart, DollarSign, BellRing } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

interface CustomerCardProps {
    customer: CustomerWithSalesData;
    onEdit: (customer: CustomerWithSalesData) => void;
    onDelete: (customer: CustomerWithSalesData) => void;
}

const CustomerCardComponent = ({ customer, onEdit, onDelete }: CustomerCardProps) => {
    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
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
                 {customer.isReminderDue && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="absolute top-3 right-12 p-1 bg-destructive/20 rounded-full">
                                    <BellRing className="h-4 w-4 text-destructive animate-pulse" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Rappel de paiement requis</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                 <div className="flex items-center text-sm">
                    <BarChart className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="text-muted-foreground">Total dépensé:</span>
                    <span className="font-semibold ml-auto">{customer.totalSpent.toFixed(1)} DA</span>
                </div>
                <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="text-muted-foreground">Solde impayé:</span>
                     <span className={`font-semibold ml-auto ${customer.outstandingBalance > 0 ? 'text-destructive' : ''}`}>{customer.outstandingBalance.toFixed(1)} DA</span>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Button variant="outline" asChild className="w-full">
                    <Link href={`/customers/${customer.id}`}>
                        Voir l'historique
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export const CustomerCard = React.memo(CustomerCardComponent);

'use client';

import React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, DollarSign, BellRing, ShieldCheck, Home, Calendar, Hourglass } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

const DebtStatusIcon = ({ status }: { status: Customer['debtStatus']}) => {
    switch (status) {
        case 'overdue':
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-3 right-12 p-1 bg-destructive/20 rounded-full">
                                <BellRing className="h-4 w-4 text-destructive animate-pulse" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Paiement en retard</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        case 'due_soon':
             return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-3 right-12 p-1 bg-chart-secondary/20 rounded-full">
                                <Hourglass className="h-4 w-4 text-chart-secondary" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Échéance proche</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        default:
            return null;
    }
};


const CustomerCardComponent = ({ customer, onEdit, onDelete }: CustomerCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const creditUsage = customer.creditLimit && customer.creditLimit > 0 ? (customer.outstandingBalance / customer.creditLimit) * 100 : 0;

    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">
                            <Link href={`/customers/${customer.uuid}`} className="hover:underline">
                                {customer.firstName} {customer.lastName}
                            </Link>
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                             {customer.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    <span>{customer.phone}</span>
                                </div>
                            )}
                             {customer.address && (
                                <div className="flex items-center gap-2">
                                    <Home className="h-3 w-3" />
                                    <span className="truncate">{customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/${customer.uuid}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Voir les détails
                                </Link>
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <>
                                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <DebtStatusIcon status={customer.debtStatus} />
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
                 <div className="space-y-2">
                    <div className="flex items-center text-sm">
                        <ShieldCheck className="h-4 w-4 mr-2 text-muted-foreground"/>
                        <span className="text-muted-foreground">Limite crédit:</span>
                         <span className="font-semibold ml-auto">{typeof customer.creditLimit === 'number' ? formatCurrency(customer.creditLimit) : 'N/A'}</span>
                    </div>
                    {customer.creditLimit && customer.creditLimit > 0 && (
                        <Progress value={creditUsage} className={cn("h-1.5", creditUsage > 100 ? "[&>div]:bg-destructive" : creditUsage > 90 ? "[&>div]:bg-chart-secondary" : "")} />
                    )}
                 </div>
                 <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="text-muted-foreground">Total Dépensé:</span>
                     <span className={`font-semibold ml-auto`}>{formatCurrency(customer.totalSpent)}</span>
                </div>
                <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="text-muted-foreground">Solde impayé:</span>
                     <span className={`font-semibold ml-auto ${customer.outstandingBalance > 0 ? 'text-destructive' : ''}`}>{formatCurrency(customer.outstandingBalance)}</span>
                </div>
                 <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground"/>
                    <span className="text-muted-foreground">Dernière activité:</span>
                     <span className="font-semibold ml-auto">{customer.lastActivityDate ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr }) : 'N/A'}</span>
                </div>
            </CardContent>
            <CardFooter className="pt-0">
                <Button variant="outline" asChild className="w-full">
                    <Link href={`/customers/${customer.uuid}`}>
                        Voir l'historique
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export const CustomerCard = React.memo(CustomerCardComponent);

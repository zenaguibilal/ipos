
'use client';

import React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, DollarSign, BellRing, ShieldCheck, Home, Calendar, Hourglass, HandCoins, Printer, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { Checkbox } from '../ui/checkbox';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onPayment: (customer: Customer) => void;
    onStatement: (customer: Customer) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const DebtStatusIcon = ({ status }: { status: Customer['debtStatus']}) => {
    switch (status) {
        case 'overdue':
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-3 right-12 p-1 bg-destructive/20 rounded-full border border-destructive/30">
                                <BellRing className="h-4 w-4 text-destructive animate-pulse" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Paiement en retard critique</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        case 'due_soon':
             return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="absolute top-3 right-12 p-1 bg-chart-secondary/20 rounded-full border border-chart-secondary/30">
                                <Hourglass className="h-4 w-4 text-chart-secondary" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent><p>Échéance de paiement proche</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        default:
            return null;
    }
};


const CustomerCardComponent = ({ customer, onEdit, onDelete, onPayment, onStatement, isSelected, onToggleSelection }: CustomerCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const companyProfile = useAppStore(state => state.profile);
    const creditUsage = customer.creditLimit && customer.creditLimit > 0 ? (customer.outstandingBalance / customer.creditLimit) * 100 : 0;

    const handleWhatsAppReminder = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!customer.phone) return;
        const storeName = companyProfile?.companyName || "iPOS Store";
        const message = `Bonjour ${customer.firstName}, votre solde chez ${storeName} est de ${customer.outstandingBalance.toFixed(1)} DA. Merci.`;
        window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!customer.phone) return;
        window.location.href = `tel:${customer.phone}`;
    };

    return (
        <Card className={cn(
            "flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative group",
            isSelected && "ring-2 ring-primary border-primary/50",
            customer.outstandingBalance > 0 && "border-destructive/20"
        )}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <div onClick={(e) => e.stopPropagation()} className="pt-1">
                            <Checkbox
                                checked={isSelected}
                                onCheckedChange={onToggleSelection}
                                className="h-5 w-5"
                            />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-xl leading-none">
                                <Link href={`/customers/${customer.uuid}`} className="hover:underline hover:text-primary transition-colors">
                                    {customer.firstName} {customer.lastName}
                                </Link>
                            </CardTitle>
                            <div className="flex items-center text-xs text-muted-foreground gap-3">
                                {customer.phone && (
                                    <button onClick={handleCall} className="flex items-center gap-1 hover:text-primary transition-colors">
                                        <Phone className="h-3 w-3" />
                                        <span>{customer.phone}</span>
                                    </button>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-1">
                                        <Home className="h-3 w-3" />
                                        <span className="truncate max-w-[120px]">{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/customers/${customer.uuid}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Consulter historique
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatement(customer)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimer relevé
                            </DropdownMenuItem>
                            {customer.phone && (
                                <DropdownMenuItem onClick={handleWhatsAppReminder}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Envoyer tappel (WhatsApp)
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                                onClick={() => onPayment(customer)}
                                disabled={customer.outstandingBalance <= 0}
                            >
                                <HandCoins className="mr-2 h-4 w-4" />
                                Encaisser paiement
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <>
                                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier le profil
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
            <CardContent className="flex-grow space-y-4 pb-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center"><ShieldCheck className="h-3 w-3 mr-1"/> Utilisation Crédit:</span>
                         <span className={cn("font-bold", creditUsage > 90 ? "text-destructive" : "text-foreground")}>
                            {customer.creditLimit ? `${Math.round(creditUsage)}%` : 'Sans limite'}
                         </span>
                    </div>
                    {customer.creditLimit && customer.creditLimit > 0 && (
                        <div className="space-y-1">
                            <Progress value={Math.min(creditUsage, 100)} className={cn("h-1.5", creditUsage > 100 ? "[&>div]:bg-destructive" : creditUsage > 80 ? "[&>div]:bg-chart-secondary" : "")} />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Solde: {formatCurrency(customer.outstandingBalance)}</span>
                                <span>Plafond: {formatCurrency(customer.creditLimit)}</span>
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center"><DollarSign className="h-3 w-3 mr-1"/> Total Dépensé</p>
                        <p className="text-sm font-bold">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center"><Calendar className="h-3 w-3 mr-1"/> Activité</p>
                        <p className="text-sm font-bold truncate">
                            {customer.lastActivityDate ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr }) : 'Aucune'}
                        </p>
                    </div>
                 </div>
            </CardContent>
            <CardFooter className="pt-0 gap-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/customers/${customer.uuid}`}>
                        Détails
                    </Link>
                </Button>
                <Button 
                    size="sm"
                    className={cn("flex-1", customer.outstandingBalance > 0 ? "bg-destructive hover:bg-destructive/90" : "bg-primary")}
                    onClick={() => onPayment(customer)}
                    disabled={customer.outstandingBalance <= 0}
                >
                    <HandCoins className="mr-2 h-4 w-4" /> Encaisser
                </Button>
            </CardFooter>
        </Card>
    );
}

export const CustomerCard = React.memo(CustomerCardComponent);

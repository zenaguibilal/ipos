
'use client';

import React from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, FileText, Phone, DollarSign, BellRing, ShieldCheck, Home, Calendar, Hourglass, HandCoins, Printer, MessageSquare, User, Tag, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';

interface CustomerCardProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
    onPayment: (customer: Customer) => void;
    onStatement: (customer: Customer) => void;
    isSelected?: boolean;
    onToggleSelection?: () => void;
}

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

    const handleCardClick = (e: React.MouseEvent) => {
        if (onToggleSelection) {
            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
            onToggleSelection();
        }
    };

    return (
        <Card 
            onClick={handleCardClick}
            className={cn(
                "flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 relative group luxury-glass border-white/5 overflow-hidden",
                customer.outstandingBalance > 0 && "border-destructive/10 bg-destructive/[0.02]",
                isSelected && "ring-2 ring-primary border-primary/50 bg-primary/5"
            )}
        >
            <div className={cn(
                "absolute top-3 left-3 z-10 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={onToggleSelection} 
                    className="h-5 w-5 bg-background shadow-lg border-primary/30" 
                />
            </div>

            <CardHeader className="pb-3 pt-6 px-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {customer.firstName[0].toUpperCase()}{customer.lastName[0].toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-black uppercase tracking-tight truncate max-w-[160px]">
                                {customer.firstName} {customer.lastName}
                            </CardTitle>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest h-5 bg-muted/50 border-white/5">
                                <Tag className="h-2.5 w-2.5 mr-1.5 text-primary" />
                                {customer.category}
                            </Badge>
                        </div>
                    </div>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass p-2">
                            <DropdownMenuItem asChild className="rounded-lg font-bold">
                                <Link href={`/customers/${customer.uuid}`} className="gap-2">
                                    <FileText className="h-4 w-4" /> Dossier Patient
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatement(customer)} className="rounded-lg font-bold gap-2">
                                <Printer className="h-4 w-4 text-primary" /> Relevé A4
                            </DropdownMenuItem>
                            {customer.phone && (
                                <DropdownMenuItem onClick={handleWhatsAppReminder} className="rounded-lg font-bold gap-2 text-green-500">
                                    <MessageSquare className="h-4 w-4" /> Rappel WhatsApp
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            {isManagerOrAdmin && (
                                <>
                                    <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-lg font-bold gap-2">
                                        <Edit className="h-4 w-4" /> Modifier Profil
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg font-bold gap-2">
                                        <Trash2 className="h-4 w-4" /> Supprimer
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="px-6 py-4 flex-grow space-y-6">
                 {/* Credit Health */}
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        <span>Santé Crédit</span>
                        <span className={cn(creditUsage > 90 ? "text-destructive" : "text-chart-quaternary")}>
                            {customer.creditLimit ? `${Math.round(creditUsage)}% used` : 'Uncapped'}
                        </span>
                    </div>
                    {customer.creditLimit > 0 ? (
                        <div className="space-y-2">
                            <Progress value={Math.min(creditUsage, 100)} className={cn("h-2", creditUsage > 100 ? "[&>div]:bg-destructive" : creditUsage > 80 ? "[&>div]:bg-orange-500" : "")} />
                            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground opacity-50 uppercase">
                                <span>Solde Dû</span>
                                <span>Plafond: {formatCurrency(customer.creditLimit)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="h-2 w-full bg-white/5 rounded-full border border-white/5" />
                    )}
                 </div>

                 {/* Stats Mini Grid */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center shadow-inner">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 flex items-center">
                            <DollarSign className="h-2.5 w-2.5 mr-1 text-primary" /> Volume Achat
                        </p>
                        <p className="text-sm font-black tracking-tight">{formatCurrency(customer.totalSpent)}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center shadow-inner">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 flex items-center">
                            <Calendar className="h-2.5 w-2.5 mr-1 text-primary" /> Dernière Act.
                        </p>
                        <p className="text-[10px] font-bold truncate">
                            {customer.lastActivityDate ? formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr }) : 'Inactif'}
                        </p>
                    </div>
                 </div>
            </CardContent>

            <CardFooter className={cn(
                "p-4 border-t mt-auto relative z-10",
                customer.outstandingBalance > 0 ? "bg-destructive/5 border-destructive/10" : "bg-primary/5 border-primary/10"
            )}>
                <div className="flex justify-between items-center w-full">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-0.5 opacity-60">Solde Impayé</span>
                        <span className={cn(
                            "text-xl font-black tracking-tighter",
                            customer.outstandingBalance > 0 ? "text-destructive" : "text-chart-quaternary"
                        )}>
                            {formatCurrency(customer.outstandingBalance)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            size="sm"
                            className={cn(
                                "rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-5 shadow-lg",
                                customer.outstandingBalance > 0 ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                            )}
                            onClick={(e) => { e.stopPropagation(); onPayment(customer); }}
                            disabled={customer.outstandingBalance <= 0}
                        >
                            <HandCoins className="mr-2 h-4 w-4" /> Encaisser
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-white/10">
                            <Link href={`/customers/${customer.uuid}`} onClick={(e) => e.stopPropagation()}>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}

export const CustomerCard = React.memo(CustomerCardComponent);

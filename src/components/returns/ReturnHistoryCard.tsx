
'use client';

import React from 'react';
import type { ProductReturn, Customer } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Printer, User, Banknote, HandCoins, Clock, Receipt, Undo2 } from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface ReturnCardProps {
    productReturn: ProductReturn;
    customerName: string;
    onViewDetails: (pr: ProductReturn) => void;
    onCancelReturn: (pr: ProductReturn) => void;
    onPrint: (pr: ProductReturn, format: 'thermal' | 'a4') => void;
}

export const ReturnHistoryCard = React.memo<ReturnCardProps>(({ 
    productReturn, 
    customerName, 
    onViewDetails, 
    onCancelReturn, 
    onPrint 
}) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const impactDebt = Math.max(0, productReturn.totalReturnValue - productReturn.amountRefunded);

    return (
        <Card className="flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 relative group luxury-glass border-destructive/10 bg-muted/10 overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Undo2 className="h-32 w-32 rotate-12" />
            </div>

            <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-3.5 w-3.5 text-destructive opacity-60" />
                            <CardTitle className="text-sm font-mono font-black text-destructive tracking-tighter">#{productReturn.originalInvoiceNumber}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground opacity-60 uppercase">
                            <Clock className="h-3 w-3" />
                            {format(safeToDate(productReturn.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[180px] shadow-2xl">
                            <DropdownMenuItem onClick={() => onViewDetails(productReturn)} className="rounded-lg font-bold gap-3 py-2.5">
                                <FileText className="h-4 w-4 opacity-60" /> Détails Flux
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPrint(productReturn, 'thermal')} className="rounded-lg font-bold gap-3 py-2.5">
                                <Printer className="h-4 w-4 text-primary" /> Ticket 80mm
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <DropdownMenuItem onClick={() => onCancelReturn(productReturn)} className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 gap-3 py-2.5">
                                    <Trash2 className="h-4 w-4" /> Annuler Retour
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4 flex-grow">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/40 border border-white/5 shadow-inner">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 opacity-30" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Identité Cliente</p>
                        <p className="font-bold text-sm truncate uppercase tracking-tight">{customerName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-chart-quaternary/5 border border-chart-quaternary/10">
                        <p className="text-[8px] font-black uppercase text-chart-quaternary/60 mb-1">Remboursé</p>
                        <p className="text-sm font-black text-chart-quaternary flex items-center gap-1.5">
                            {formatCurrency(productReturn.amountRefunded)}
                            <Banknote className="h-3 w-3" />
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-[8px] font-black uppercase text-primary/60 mb-1">Impact Solde</p>
                        <p className="text-sm font-black text-primary flex items-center gap-1.5">
                            -{formatCurrency(impactDebt)}
                            <HandCoins className="h-3 w-3" />
                        </p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="bg-destructive/5 p-4 border-t border-destructive/10 mt-auto relative z-10">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive/70">Valeur Nette Retour</span>
                    <span className="text-2xl font-black text-destructive tracking-tighter">-{formatCurrency(productReturn.totalReturnValue)}</span>
                </div>
            </CardFooter>
        </Card>
    );
});
ReturnHistoryCard.displayName = 'ReturnHistoryCard';


'use client';

import React from 'react';
import type { Sale } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Printer, CreditCard, Banknote, HandCoins, ShoppingBag, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';

interface SalesHistoryCardProps {
    sale: Sale;
    customerName?: string;
    customerPhone?: string;
    onViewDetails: (sale: Sale) => void;
    onCancelSale: (sale: Sale) => void;
    onPrint: (sale: Sale) => void;
    onRecordPayment?: () => void;
}

export const SalesHistoryCard = React.memo(({ sale, customerName, customerPhone, onViewDetails, onCancelSale, onPrint, onRecordPayment }: SalesHistoryCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const profile = useAppStore(state => state.profile);
    const hasCard = sale.payments.some(p => p.method === 'card');

    const paymentStatusMap = {
        paid: { text: 'Soldé', icon: CheckCircle, color: 'text-chart-quaternary', bg: 'bg-chart-quaternary/10' },
        partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary', bg: 'bg-chart-secondary/10' },
        unpaid: { text: 'À Crédit', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
    };
    const status = paymentStatusMap[sale.paymentStatus];

    const handleWhatsAppShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!sale || !customerPhone) return;
        const storeName = profile?.companyName || "iPOS Authority";
        const dateStr = format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm');
        
        const itemsList = sale.items.map(i => `• ${i.name}\n  (${i.quantity} x ${i.price.toFixed(1)} DA)`).join('\n');
        
        const message = `*${storeName} - FACTURE NUMÉRIQUE*\n` +
                        `------------------------------\n` +
                        `🧾 Réf: #${sale.invoiceNumber}\n` +
                        `📅 Date: ${dateStr}\n` +
                        `------------------------------\n` +
                        `${itemsList}\n` +
                        `------------------------------\n` +
                        `*TOTAL À PAYER: ${sale.total.toFixed(1)} DA*\n` +
                        `💰 Payé: ${sale.amountPaid.toFixed(1)} DA\n` +
                        `💳 Reste: ${sale.remainingBalance.toFixed(1)} DA\n\n` +
                        `_Merci de votre confiance_`;

        window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <Card className="flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden luxury-glass border-white/5 bg-muted/10">
            {/* Luxury Background Decor */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none">
                <ShoppingBag className="h-32 w-32 rotate-12 text-primary" />
            </div>

            <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-mono font-black text-primary tracking-tighter">{sale.invoiceNumber}</CardTitle>
                        <CardDescription className="text-[10px] flex items-center gap-1.5 uppercase tracking-[0.1em] font-black opacity-50">
                            <Clock className="h-3 w-3 text-primary/40" />
                            {format(safeToDate(sale.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[180px] shadow-2xl border-white/10">
                            <DropdownMenuItem onClick={() => onViewDetails(sale)} className="rounded-lg font-bold gap-3 py-2.5">
                                <FileText className="h-4 w-4 opacity-60" /> Détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPrint(sale)} className="rounded-lg font-bold gap-3 py-2.5">
                                <Printer className="h-4 w-4 text-primary" /> Imprimer reçu
                            </DropdownMenuItem>
                            {customerPhone && (
                                <DropdownMenuItem onClick={handleWhatsAppShare} className="rounded-lg font-bold text-green-600 gap-3 py-2.5">
                                    <MessageSquare className="h-4 w-4" /> Partager WhatsApp
                                </DropdownMenuItem>
                            )}
                            {onRecordPayment && (
                                <DropdownMenuItem onClick={onRecordPayment} className="rounded-lg font-black text-primary bg-primary/5 gap-3 py-2.5">
                                    <HandCoins className="h-4 w-4" /> Encaisser solde
                                </DropdownMenuItem>
                            )}
                            {isManagerOrAdmin && (
                                <DropdownMenuItem onClick={() => onCancelSale(sale)} className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 gap-3 py-2.5">
                                    <Trash2 className="h-4 w-4" /> Annuler vente
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-4 flex-grow text-sm">
                 <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Client</span>
                    <span className="font-black text-xs uppercase truncate max-w-[140px] tracking-tight">{customerName || 'Passage'}</span>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Articles</span>
                    <Badge variant="secondary" className="font-black h-5 px-2 rounded-lg bg-muted/50 border-white/5 text-[10px]">
                        {sale.items?.length || 0}
                    </Badge>
                </div>
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Statut</span>
                    <Badge className={cn('text-[9px] uppercase font-black py-1 px-3 rounded-full border border-white/5', status.color, status.bg)}>
                        <status.icon className="mr-1.5 h-3 w-3" />
                        {status.text}
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="bg-primary/5 p-5 border-t border-white/5 mt-auto relative z-10">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-background/40 border border-white/10 shadow-inner">
                            {hasCard ? <CreditCard className="h-3.5 w-3.5 text-primary opacity-60" /> : <Banknote className="h-3.5 w-3.5 text-primary opacity-60" />}
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{hasCard ? 'Carte' : 'Espèces'}</span>
                    </div>
                    <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(sale.total)}</span>
                </div>
            </CardFooter>
        </Card>
    );
});
SalesHistoryCard.displayName = 'SalesHistoryCard';

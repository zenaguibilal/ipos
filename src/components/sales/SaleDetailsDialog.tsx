
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, X, HandCoins, MessageSquare, Share2, FileText, Hash, Calendar } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/appStore';
import { Badge } from '../ui/badge';

interface SaleDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
    customerPhone?: string;
    onPrint?: () => void;
    onRecordPayment?: () => void;
}

export function SaleDetailsDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
    customerPhone,
    onPrint,
    onRecordPayment,
}: SaleDetailsDialogProps) {
    const profile = useAppStore(state => state.profile);

    if (!sale) return null;

    const handleWhatsAppShare = () => {
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
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl luxury-glass border-primary/20 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <div className="flex justify-between items-start gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Détails du Flux</DialogTitle>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center">
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-mono font-bold">
                                    <Hash className="h-3 w-3 text-primary" />
                                    Facture: {sale.invoiceNumber}
                                </Badge>
                                <Badge variant="outline" className="bg-background/40 border-white/10 py-1 gap-2 font-bold">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    {format(safeToDate(sale.createdAt!), 'd MMMM yyyy HH:mm', { locale: fr })}
                                </Badge>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 mb-1">Total Transaction</p>
                            <p className="text-4xl font-black tracking-tighter text-primary">{formatCurrency(sale.total)}</p>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="p-8 space-y-8">
                    <div className="max-h-[35vh] overflow-y-auto border rounded-[2rem] bg-background/40 shadow-inner">
                        <Table>
                            <TableHeader className="bg-white/5 sticky top-0 z-10">
                                <TableRow className="border-white/5">
                                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 pl-6">Désignation</TableHead>
                                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Qté</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">Prix U.</TableHead>
                                    <TableHead className="text-right font-black uppercase tracking-widest text-[10px] pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items?.map((item, index) => (
                                    <TableRow key={index} className="border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-bold py-4 pl-6 uppercase text-xs">{item.name}</TableCell>
                                        <TableCell className="text-center font-mono font-bold">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(item.price)}</TableCell>
                                        <TableCell className="text-right font-black pr-6">{formatCurrency(item.price * item.quantity)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4 p-6 rounded-[2rem] bg-muted/20 border border-white/5 shadow-inner">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit de Paiement</h4>
                                {onRecordPayment && (
                                    <Button variant="ghost" size="sm" onClick={onRecordPayment} className="h-7 px-3 text-[9px] font-black uppercase bg-primary/10 text-primary hover:bg-primary/20 rounded-lg">
                                        <HandCoins className="h-3 w-3 mr-1.5" /> Encaisser solde
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {sale.payments.map((p, i) => (
                                    <div key={i} className="flex justify-between text-sm items-center">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{p.method === 'cash' ? '💵 Espèces' : '💳 Carte'}</span>
                                        <span className="font-black">{formatCurrency(p.amount)}</span>
                                    </div>
                                ))}
                                <Separator className="bg-white/5 my-2" />
                                {sale.amountPaid > sale.total && (
                                    <div className="flex justify-between text-xs text-chart-quaternary font-black uppercase">
                                        <span>Monnaie rendue</span>
                                        <span>{formatCurrency(sale.amountPaid - sale.total)}</span>
                                    </div>
                                )}
                                {sale.remainingBalance > 0 && (
                                    <div className="flex justify-between text-sm text-destructive font-black uppercase">
                                        <span>Reste à percevoir</span>
                                        <span>{formatCurrency(sale.remainingBalance)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/20 shadow-xl">
                                <div className="flex justify-between items-center text-xs mb-2">
                                    <span className="text-muted-foreground font-black uppercase tracking-widest opacity-60">Sous-total</span>
                                    <span className="font-bold">{formatCurrency(sale.subtotal)}</span>
                                </div>
                                {sale.discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-xs text-destructive mb-4">
                                        <span className="font-black uppercase tracking-widest opacity-60">Remise Totale</span>
                                        <span className="font-black">-{formatCurrency(sale.discountAmount)}</span>
                                    </div>
                                )}
                                <Separator className="bg-primary/10 my-3" />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[11px] font-black uppercase text-primary tracking-[0.2em]">Net Final</span>
                                    <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(sale.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-white/5 border-t border-white/5">
                    <div className="flex w-full flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={onPrint} className="flex-1 sm:flex-none rounded-xl h-12 px-6 gap-2 border-primary/30 font-black uppercase text-[10px] tracking-widest">
                                <Printer className="h-4 w-4" /> Reçu
                            </Button>
                            {customerPhone && (
                                <Button variant="outline" onClick={handleWhatsAppShare} className="flex-1 sm:flex-none rounded-xl h-12 px-6 gap-2 border-green-500/30 text-green-600 hover:bg-green-500/10 font-black uppercase text-[10px] tracking-widest">
                                    <MessageSquare className="h-4 w-4" /> WhatsApp
                                </Button>
                            )}
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest bg-muted/20">
                            Fermer
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

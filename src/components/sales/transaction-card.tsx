'use client';

import type { Sale, Payment, Customer } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CreditCard, HandCoins, FileText, BellRing, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardHeader } from '../ui/card';

type Transaction = { type: 'sale', data: Sale } | { type: 'payment', data: Payment };

interface TransactionCardProps {
    transaction: Transaction;
    customerForSale: Customer | null | undefined;
    onViewDetails: (sale: Sale) => void;
    onSendReceipt: (sale: Sale) => void;
    onSendReminder: (sale: Sale) => void;
    onDelete: (transaction: Transaction) => void;
}

export function TransactionCard({ transaction, customerForSale, onViewDetails, onSendReceipt, onSendReminder, onDelete }: TransactionCardProps) {
    const isSale = transaction.type === 'sale';
    const saleData = isSale ? transaction.data as Sale : null;
    const paymentData = !isSale ? transaction.data as Payment : null;

    const canSendWhatsApp = !!(saleData && customerForSale && customerForSale.phone);

    return (
        <Card className={cn("flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1", !isSale && "bg-green-500/10 border-green-500/20")}>
            <CardHeader className="p-4 flex-row justify-between items-start">
                <div>
                    <p className="font-semibold">{transaction.data.customerName || (isSale ? 'Vente au comptoir' : 'Paiement inconnu')}</p>
                    {isSale && <p className="text-xs text-muted-foreground font-mono">{saleData?.invoiceNumber}</p>}
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {isSale && saleData && (
                            <>
                                <DropdownMenuItem onClick={() => onViewDetails(saleData)} className="cursor-pointer">
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Voir les détails</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSendReceipt(saleData)} disabled={!canSendWhatsApp} className="cursor-pointer">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    <span>Envoyer Reçu</span>
                                </DropdownMenuItem>
                                {(saleData.paymentStatus === 'unpaid' || saleData.paymentStatus === 'partial') && (
                                    <DropdownMenuItem onClick={() => onSendReminder(saleData)} disabled={!canSendWhatsApp} className="cursor-pointer">
                                        <BellRing className="mr-2 h-4 w-4" />
                                        <span>Envoyer Rappel</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                 <div className={cn(
                    "p-4 rounded-lg flex justify-between items-center",
                    isSale ? "bg-muted" : "bg-background"
                )}>
                    <div className="flex items-center gap-2">
                        {isSale ? <CreditCard className="h-5 w-5 text-muted-foreground"/> : <HandCoins className="h-5 w-5 text-green-500"/>}
                        <span className="font-medium text-lg">{isSale ? 'Vente' : 'Paiement'}</span>
                    </div>
                    <div className={cn(
                        "text-xl font-bold",
                        isSale ? 'text-primary' : 'text-green-600'
                    )}>
                        {isSale && saleData ? saleData.total.toFixed(1) : `+${paymentData?.amount.toFixed(1)}`} DA
                    </div>
                </div>
            </CardContent>
            {isSale && saleData && (
                <CardFooter className="p-4 pt-0 text-xs text-center justify-center">
                    <span className={cn(
                        'rounded-full px-2.5 py-0.5 font-semibold',
                        saleData.paymentStatus === 'paid' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                        saleData.paymentStatus === 'partial' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                        saleData.paymentStatus === 'unpaid' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    )}>
                        {saleData.paymentStatus === 'paid' ? 'Payé' : saleData.paymentStatus === 'partial' ? 'Partiel' : 'Impayé'}
                    </span>
                </CardFooter>
            )}
        </Card>
    );
}

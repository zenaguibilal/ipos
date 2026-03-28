
'use client';

import React from 'react';
import type { Sale, Customer } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Printer, Banknote, CreditCard, HandCoins, User } from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

/**
 * @fileOverview Sales History Table (Luxury Sovereign Style)
 */

interface SalesHistoryTableProps {
  sales: Sale[];
  customerMap: Map<string, Customer>;
  onViewDetails: (sale: Sale) => void;
  onCancelSale: (sale: Sale) => void;
  onPrint: (sale: Sale) => void;
  onRecordPayment?: (sale: Sale) => void;
}

export function SalesHistoryTable({
  sales,
  customerMap,
  onViewDetails,
  onCancelSale,
  onPrint,
  onRecordPayment,
}: SalesHistoryTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  const paymentStatusMap = {
    paid: { text: 'Soldé', icon: CheckCircle, color: 'text-chart-quaternary', bg: 'bg-chart-quaternary/10 border-chart-quaternary/20' },
    partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary', bg: 'bg-chart-secondary/10 border-chart-secondary/20' },
    unpaid: { text: 'À Crédit', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  };

  return (
    <div className="rounded-[2rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground py-6 px-8">Référence Flux</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Instantané Temporel</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Entité Cliente</TableHead>
            <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Volume</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">État Règlement</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-10">Total Net</TableHead>
            <TableHead className="w-[100px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            const status = paymentStatusMap[sale.paymentStatus];
            const hasCard = sale.payments?.some(p => p.method === 'card');

            return (
              <TableRow 
                key={sale.uuid} 
                className="hover:bg-primary/5 transition-colors border-white/5 cursor-pointer group" 
                onClick={() => onViewDetails(sale)}
              >
                <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-mono font-black text-xs text-primary shadow-inner group-hover:scale-110 transition-transform">
                            {sale.invoiceNumber.split('-')[1]}
                        </div>
                        <span className="font-mono font-bold text-sm tracking-tight text-foreground">{sale.invoiceNumber}</span>
                    </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-tighter">{format(safeToDate(sale.createdAt!), 'dd MMMM yyyy', { locale: fr })}</span>
                    <span className="text-[10px] font-mono opacity-40">{format(safeToDate(sale.createdAt!), 'HH:mm:ss')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 opacity-30" />
                    </div>
                    <span className="font-bold text-sm truncate max-w-[180px] group-hover:text-primary transition-colors">{customerName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-black h-5 text-[9px] px-2 rounded-lg bg-muted/50 border-white/5">
                    {sale.items?.length || 0} art.
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge className={cn('text-[9px] uppercase font-black py-1.5 px-4 rounded-xl border', status.color, status.bg)}>
                    <status.icon className="mr-2 h-3 w-3" />
                    {status.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-10" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-primary tracking-tighter">{formatCurrency(sale.total)}</span>
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                            {hasCard ? <CreditCard className="h-2.5 w-2.5" /> : <Banknote className="h-2.5 w-2.5" />}
                            {hasCard ? 'Flux Mixte/Carte' : 'Cash Intégral'}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right px-8" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[200px] shadow-2xl border-white/10">
                      <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1.5 tracking-widest">Souveraineté</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(sale)} className="rounded-xl py-3 font-bold gap-3">
                        <FileText className="h-4 w-4 opacity-60" /> Archives du Flux
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrint(sale)} className="rounded-xl py-3 font-bold gap-3">
                        <Printer className="h-4 w-4 text-primary" /> Réédition Ticket
                      </DropdownMenuItem>
                      {onRecordPayment && sale.remainingBalance > 0 && (
                        <DropdownMenuItem onClick={() => onRecordPayment(sale)} className="rounded-xl py-3 font-black text-primary bg-primary/5 gap-3">
                          <HandCoins className="h-4 w-4" /> Encaisser Solde
                        </DropdownMenuItem>
                      )}
                      {isManagerOrAdmin && (
                        <>
                        <DropdownMenuSeparator className="bg-white/5 my-2" />
                        <DropdownMenuItem 
                          onClick={() => onCancelSale(sale)} 
                          className="rounded-xl py-3 font-black text-destructive focus:text-destructive focus:bg-destructive/10 gap-3"
                        >
                          <Trash2 className="h-4 w-4" /> Révoquer la Vente
                        </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

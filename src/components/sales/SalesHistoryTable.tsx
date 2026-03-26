
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
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock, Printer, Banknote, CreditCard } from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface SalesHistoryTableProps {
  sales: Sale[];
  customerMap: Map<string, Customer>;
  onViewDetails: (sale: Sale) => void;
  onCancelSale: (sale: Sale) => void;
  onPrint: (sale: Sale) => void;
}

export function SalesHistoryTable({
  sales,
  customerMap,
  onViewDetails,
  onCancelSale,
  onPrint,
}: SalesHistoryTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  const paymentStatusMap = {
    paid: { text: 'Payé', icon: CheckCircle, color: 'text-chart-quaternary', bg: 'bg-chart-quaternary/10' },
    partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary', bg: 'bg-chart-secondary/10' },
    unpaid: { text: 'Impayé', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
  };

  return (
    <div className="rounded-xl border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-primary/10">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Facture</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date & Heure</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Client</TableHead>
            <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Items</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Statut</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Total</TableHead>
            <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            const status = paymentStatusMap[sale.paymentStatus];
            const hasCard = sale.payments.some(p => p.method === 'card');

            return (
              <TableRow key={sale.uuid} className="hover:bg-primary/5 transition-colors border-primary/5 cursor-pointer" onClick={() => onViewDetails(sale)}>
                <TableCell className="font-mono font-bold text-primary">{sale.invoiceNumber}</TableCell>
                <TableCell className="text-[11px] font-medium">
                  {format(safeToDate(sale.createdAt!), 'dd/MM/yy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell className="font-semibold truncate max-w-[150px]">
                  {customerName}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-mono h-5 text-[10px] px-1.5">{sale.items.length}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn('text-[9px] uppercase font-black py-0 h-5 border-0', status.color, status.bg)}>
                    <status.icon className="mr-1 h-2.5 w-2.5" />
                    {status.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end">
                        <span className="font-black text-foreground">{formatCurrency(sale.total)}</span>
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase font-black tracking-tighter">
                            {hasCard ? <CreditCard className="h-2 w-2" /> : <Banknote className="h-2 w-2" />}
                            {hasCard ? 'Carte' : 'Espèces'}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="luxury-glass">
                      <DropdownMenuItem onClick={() => onViewDetails(sale)}>
                        <FileText className="mr-2 h-4 w-4" /> Détails complets
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrint(sale)}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer reçu
                      </DropdownMenuItem>
                      {isManagerOrAdmin && (
                        <DropdownMenuItem 
                          onClick={() => onCancelSale(sale)} 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Annuler la vente
                        </DropdownMenuItem>
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

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
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">Facture</TableHead>
            <TableHead className="font-bold">Date & Heure</TableHead>
            <TableHead className="font-bold">Client</TableHead>
            <TableHead className="text-center font-bold">Articles</TableHead>
            <TableHead className="text-right font-bold">Statut</TableHead>
            <TableHead className="text-right font-bold">Total</TableHead>
            <TableHead className="w-[80px] text-right font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            const status = paymentStatusMap[sale.paymentStatus];
            const hasCard = sale.payments.some(p => p.method === 'card');

            return (
              <TableRow key={sale.uuid} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono font-bold text-primary">{sale.invoiceNumber}</TableCell>
                <TableCell className="text-xs">
                  {format(safeToDate(sale.createdAt!), 'dd/MM/yy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell className="font-medium truncate max-w-[150px]">
                  {customerName}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-mono h-6">{sale.items.length}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn('text-[10px] uppercase font-bold py-0 h-5', status.color, status.bg, status.color.replace('text-', 'border-'))}>
                    <status.icon className="mr-1 h-3 w-3" />
                    {status.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                        <span className="font-black text-foreground">{formatCurrency(sale.total)}</span>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase font-bold">
                            {hasCard ? <CreditCard className="h-2.5 w-2.5" /> : <Banknote className="h-2.5 w-2.5" />}
                            {hasCard ? 'Carte' : 'Espèces'}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(sale)}>
                        <FileText className="mr-2 h-4 w-4" /> Détails
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrint(sale)}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer reçu
                      </DropdownMenuItem>
                      {isManagerOrAdmin && (
                        <DropdownMenuItem 
                          onClick={() => onCancelSale(sale)} 
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Annuler vente
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

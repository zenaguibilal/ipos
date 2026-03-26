
'use client';

import React from 'react';
import type { Sale } from '@/lib/types';
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
import { MoreHorizontal, FileText, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface SalesHistoryTableProps {
  sales: Sale[];
  customerMap: Map<string, any>;
  onViewDetails: (sale: Sale) => void;
  onCancelSale: (sale: Sale) => void;
}

export function SalesHistoryTable({
  sales,
  customerMap,
  onViewDetails,
  onCancelSale,
}: SalesHistoryTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  const paymentStatusMap = {
    paid: { text: 'Payé', icon: CheckCircle, color: 'text-chart-quaternary', bg: 'bg-chart-quaternary/10' },
    partial: { text: 'Partiel', icon: AlertCircle, color: 'text-chart-secondary', bg: 'bg-chart-secondary/10' },
    unpaid: { text: 'Impayé', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10' },
  };

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Facture</TableHead>
            <TableHead>Date & Heure</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-center">Articles</TableHead>
            <TableHead className="text-right">Statut</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            const status = paymentStatusMap[sale.paymentStatus];

            return (
              <TableRow key={sale.uuid} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono font-bold text-primary">{sale.invoiceNumber}</TableCell>
                <TableCell className="text-xs">
                  {format(safeToDate(sale.createdAt!), 'dd/MM/yy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell className="font-medium truncate max-w-[150px]">
                  {customerName}
                </TableCell>
                <TableCell className="text-center">
                  {sale.items.length}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={cn('text-[10px] uppercase font-bold', status.color, status.bg, status.color.replace('text-', 'border-'))}>
                    <status.icon className="mr-1 h-3 w-3" />
                    {status.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-black">
                  {formatCurrency(sale.total)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(sale)}>
                        <FileText className="mr-2 h-4 w-4" /> Détails
                      </DropdownMenuItem>
                      {isManagerOrAdmin && (
                        <DropdownMenuItem 
                          onClick={() => onCancelSale(sale)} 
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Annuler
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


'use client';

import React from 'react';
import type { ProductReturn, Customer } from '@/lib/types';
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
import { MoreHorizontal, FileText, Trash2, Printer, User, Package, Banknote, HandCoins } from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface ReturnTableProps {
  returns: ProductReturn[];
  customerMap: Map<string, Customer>;
  onViewDetails: (pr: ProductReturn) => void;
  onCancelReturn: (pr: ProductReturn) => void;
  onPrint: (pr: ProductReturn, format: 'thermal' | 'a4') => void;
}

export function ReturnTable({
  returns,
  customerMap,
  onViewDetails,
  onCancelReturn,
  onPrint,
}: ReturnTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-2xl border border-destructive/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-destructive/10">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Facture Originale</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date Retour</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Client</TableHead>
            <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Articles</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Remboursé</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Impact Solde</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Valeur Totale</TableHead>
            <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((pr) => {
            const customer = pr.customerUuid ? customerMap.get(pr.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            const impactDebt = pr.totalReturnValue - pr.amountRefunded;

            return (
              <TableRow key={pr.uuid} className="hover:bg-destructive/5 transition-colors border-destructive/5 cursor-pointer group" onClick={() => onViewDetails(pr)}>
                <TableCell className="font-mono font-bold text-destructive">#{pr.originalInvoiceNumber}</TableCell>
                <TableCell className="text-[11px] font-medium">
                  {format(safeToDate(pr.createdAt!), 'dd/MM/yy HH:mm', { locale: fr })}
                </TableCell>
                <TableCell className="font-semibold truncate max-w-[150px]">
                  {customerName}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="font-mono h-5 text-[10px] px-1.5">{pr.items.length}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <span className="font-bold text-chart-quaternary">{formatCurrency(pr.amountRefunded)}</span>
                </TableCell>
                <TableCell className="text-right">
                    {impactDebt > 0.01 ? (
                        <span className="font-bold text-primary flex items-center justify-end gap-1">
                            -{formatCurrency(impactDebt)}
                            <HandCoins className="h-3 w-3" />
                        </span>
                    ) : <span className="text-muted-foreground italic text-[10px]">Aucun</span>}
                </TableCell>
                <TableCell className="text-right">
                    <span className="font-black text-destructive">-{formatCurrency(pr.totalReturnValue)}</span>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass min-w-[180px]">
                        <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1.5">Options Retour</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails(pr)}>
                            <FileText className="mr-2 h-4 w-4" /> Détails complets
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onPrint(pr, 'thermal')}>
                            <Printer className="mr-2 h-4 w-4 text-primary" /> Ticket (80mm)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onPrint(pr, 'a4')}>
                            <Printer className="mr-2 h-4 w-4 text-primary" /> Facture A4
                        </DropdownMenuItem>
                        {isManagerOrAdmin && (
                            <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => onCancelReturn(pr)} 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Annuler le retour
                            </DropdownMenuItem>
                            </>
                        )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


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
import { MoreHorizontal, FileText, Trash2, Printer, User, Banknote, HandCoins, Clock, Receipt } from 'lucide-react';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * @fileOverview Return Table (Luxury Sovereign Style with Selection)
 */

interface ReturnTableProps {
  returns: ProductReturn[];
  customerMap: Map<string, Customer>;
  onViewDetails: (pr: ProductReturn) => void;
  onCancelReturn: (pr: ProductReturn) => void;
  onPrint: (pr: ProductReturn, format: 'thermal' | 'a4') => void;
  selectedReturns?: Set<string>;
  onToggleSelection?: (uuid: string) => void;
  onToggleAll?: () => void;
}

export function ReturnTable({
  returns,
  customerMap,
  onViewDetails,
  onCancelReturn,
  onPrint,
  selectedReturns = new Set(),
  onToggleSelection,
  onToggleAll,
}: ReturnTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-[2rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            {onToggleAll && (
                <TableHead className="w-12 px-6 py-5">
                    <Checkbox 
                        checked={returns.length > 0 && selectedReturns.size === returns.length} 
                        onCheckedChange={onToggleAll} 
                    />
                </TableHead>
            )}
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground py-6 px-8">Origine Sale</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Horodatage</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Entité Cliente</TableHead>
            <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Items</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Refund Cash</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Impact Solde</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-10">Valeur Nette</TableHead>
            <TableHead className="w-[100px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {returns.map((pr) => {
            const customer = pr.customerUuid ? customerMap.get(pr.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            const impactDebt = Math.max(0, pr.totalReturnValue - pr.amountRefunded);
            const isSelected = selectedReturns.has(pr.uuid);

            return (
              <TableRow 
                key={pr.uuid} 
                className={cn(
                    "hover:bg-destructive/5 transition-colors border-white/5 cursor-pointer group",
                    isSelected && "bg-destructive/10"
                )} 
                onClick={() => onToggleSelection?.(pr.uuid)}
              >
                {onToggleSelection && (
                    <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(pr.uuid)} />
                    </TableCell>
                )}
                <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center font-mono font-black text-xs text-destructive shadow-inner group-hover:scale-110 transition-transform">
                            {pr.originalInvoiceNumber.split('-')[1]}
                        </div>
                        <span className="font-mono font-bold text-sm tracking-tight text-foreground">#{pr.originalInvoiceNumber}</span>
                    </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-tighter">{format(safeToDate(pr.createdAt!), 'dd MMMM yyyy', { locale: fr })}</span>
                    <span className="text-[10px] font-mono opacity-40">{format(safeToDate(pr.createdAt!), 'HH:mm:ss')}</span>
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
                    {pr.items.length} art.
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <span className="font-bold text-chart-quaternary text-xs flex items-center justify-end gap-1.5">
                        {formatCurrency(pr.amountRefunded)}
                        <Banknote className="h-3 w-3 opacity-40" />
                    </span>
                </TableCell>
                <TableCell className="text-right">
                    {impactDebt > 0.01 ? (
                        <span className="font-bold text-primary text-xs flex items-center justify-end gap-1.5">
                            -{formatCurrency(impactDebt)}
                            <HandCoins className="h-3 w-3 opacity-40" />
                        </span>
                    ) : <span className="text-muted-foreground italic text-[10px] opacity-30">Inexistant</span>}
                </TableCell>
                <TableCell className="text-right pr-10" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-destructive tracking-tighter">-{formatCurrency(pr.totalReturnValue)}</span>
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40">
                            <Receipt className="h-2.5 w-2.5" />
                            Correction de Stock
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-right px-8" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[200px] shadow-2xl border-white/10">
                      <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1.5 tracking-widest">Souveraineté</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails(pr)} className="rounded-xl py-3 font-bold gap-3">
                        <FileText className="h-4 w-4 opacity-60" /> Archives du Flux
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrint(pr, 'thermal')} className="rounded-xl py-3 font-bold gap-3">
                        <Printer className="h-4 w-4 text-primary" /> Ticket Thermique
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPrint(pr, 'a4')} className="rounded-xl py-3 font-bold gap-3">
                        <Printer className="h-4 w-4 text-primary" /> Facture A4
                      </DropdownMenuItem>
                      {isManagerOrAdmin && (
                        <>
                        <DropdownMenuSeparator className="bg-white/5 my-2" />
                        <DropdownMenuItem 
                          onClick={() => onCancelReturn(pr)} 
                          className="rounded-xl py-3 font-black text-destructive focus:text-destructive focus:bg-destructive/10 gap-3"
                        >
                          <Trash2 className="h-4 w-4" /> Annuler l'opération
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

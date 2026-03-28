
'use client';

import React from 'react';
import type { Customer } from '@/lib/types';
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
import { MoreHorizontal, Edit, Trash2, FileText, Phone, HandCoins, Printer, MessageSquare, User, Tag, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
  onStatement: (customer: Customer) => void;
  selectedCustomers?: Set<string>;
  onToggleSelection?: (uuid: string) => void;
  onToggleAll?: () => void;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onPayment,
  onStatement,
  selectedCustomers = new Set(),
  onToggleSelection,
  onToggleAll,
}: CustomerTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();
  const companyProfile = useAppStore(state => state.profile);

  const handleWhatsAppReminder = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!customer.phone) return;
    const storeName = companyProfile?.companyName || "iPOS Authority";
    const message = `Bonjour ${customer.firstName}, votre solde chez *${storeName}* est de *${customer.outstandingBalance.toFixed(1)} DA*. Merci.`;
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="rounded-[2rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            {onToggleAll && (
                <TableHead className="w-12 px-6 py-5">
                    <Checkbox 
                        checked={customers.length > 0 && selectedCustomers.size === customers.length} 
                        onCheckedChange={onToggleAll} 
                    />
                </TableHead>
            )}
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Identité Client</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Contact & Catégorie</TableHead>
            <TableHead className="hidden lg:table-cell text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Activité</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Limite Crédit</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Volume Achat</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-8">Solde Impayé</TableHead>
            <TableHead className="w-[120px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const isOverdue = customer.debtStatus === 'overdue';
            const isOverLimit = customer.isOverLimit;
            const isSelected = selectedCustomers.has(customer.uuid);

            return (
              <TableRow 
                key={customer.uuid} 
                className={cn(
                    "hover:bg-primary/5 transition-colors border-white/5 group cursor-pointer",
                    isSelected && "bg-primary/10",
                    (isOverdue || isOverLimit) && "border-l-4 border-l-destructive"
                )}
                onClick={() => onToggleSelection?.(customer.uuid)}
              >
                {onToggleSelection && (
                    <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(customer.uuid)} />
                    </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-sm text-primary shadow-inner group-hover:scale-110 transition-transform">
                        {customer.firstName[0].toUpperCase()}{customer.lastName[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <Link href={`/customers/${customer.uuid}`} className="font-black text-sm tracking-tight group-hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                        {customer.firstName} {customer.lastName}
                        </Link>
                        {isOverdue && <span className="text-[8px] text-destructive font-black uppercase tracking-widest">Retard Critique</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <Tag className="h-3 w-3 text-primary opacity-40" />
                        {customer.category}
                    </div>
                    {customer.phone && (
                        <div className="flex items-center gap-2 text-[10px] font-mono opacity-60">
                            <Phone className="h-2.5 w-2.5" />
                            {customer.phone}
                        </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {customer.lastActivityDate ? (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr })}</span>
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground opacity-60">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(customer.lastActivityDate).toLocaleDateString('fr-FR')}
                        </div>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right text-xs font-mono opacity-70">
                  {customer.creditLimit ? formatCurrency(customer.creditLimit) : 'No Limit'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <span className={cn(
                    "text-base font-black tracking-tighter",
                    customer.outstandingBalance > 0 ? "text-destructive" : "text-chart-quaternary"
                  )}>
                    {formatCurrency(customer.outstandingBalance)}
                  </span>
                </TableCell>
                <TableCell className="text-right px-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    {customer.phone && customer.outstandingBalance > 0 && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-green-600 hover:bg-green-500/10" onClick={(e) => handleWhatsAppReminder(e, customer)} title="Rappel WhatsApp">
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary hover:bg-primary/10" onClick={() => onPayment(customer)} disabled={customer.outstandingBalance <= 0} title="Encaissement">
                        <HandCoins className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[180px]">
                        <DropdownMenuItem asChild className="rounded-lg font-bold">
                            <Link href={`/customers/${customer.uuid}`}>
                            <FileText className="mr-2 h-4 w-4" /> Dossier Complet
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatement(customer)} className="rounded-lg font-bold">
                            <Printer className="mr-2 h-4 w-4 text-primary" /> Imprimer Relevé
                        </DropdownMenuItem>
                        {isManagerOrAdmin && (
                            <>
                            <DropdownMenuItem onClick={() => onEdit(customer)} className="rounded-lg font-bold">
                                <Edit className="mr-2 h-4 w-4" /> Modifier Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg font-bold">
                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer Compte
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

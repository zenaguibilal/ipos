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
import { MoreHorizontal, Edit, Trash2, FileText, Phone, HandCoins, Printer, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
  onStatement: (customer: Customer) => void;
  selectedCustomers: Set<string>;
  onToggleCustomerSelection: (customerUuid: string) => void;
  onToggleSelectAll: () => void;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onPayment,
  onStatement,
  selectedCustomers,
  onToggleCustomerSelection,
  onToggleSelectAll,
}: CustomerTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();
  const companyProfile = useAppStore(state => state.profile);

  const handleWhatsAppReminder = (customer: Customer) => {
    if (!customer.phone) return;
    const storeName = companyProfile?.companyName || "iPOS Store";
    const message = `Bonjour ${customer.firstName}, votre solde chez ${storeName} est de ${customer.outstandingBalance.toFixed(1)} DA. Merci.`;
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] px-4">
              <Checkbox
                checked={customers.length > 0 && selectedCustomers.size === customers.length}
                onCheckedChange={onToggleSelectAll}
                disabled={customers.length === 0}
              />
            </TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="hidden lg:table-cell text-center">Dernière Activité</TableHead>
            <TableHead className="text-right">Limite Crédit</TableHead>
            <TableHead className="text-right">Total Dépensé</TableHead>
            <TableHead className="text-right">Solde Impayé</TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const isSelected = selectedCustomers.has(customer.uuid);
            const isOverdue = customer.debtStatus === 'overdue';
            const isOverLimit = customer.isOverLimit;

            return (
              <TableRow key={customer.uuid} className={cn(isSelected && "bg-muted/50", (isOverdue || isOverLimit) && "border-l-4 border-l-destructive")}>
                <TableCell className="px-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleCustomerSelection(customer.uuid)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <Link href={`/customers/${customer.uuid}`} className="font-bold hover:underline">
                      {customer.firstName} {customer.lastName}
                    </Link>
                    {isOverdue && <span className="text-[10px] text-destructive font-bold uppercase tracking-tighter">Paiement en retard</span>}
                    {isOverLimit && <span className="text-[10px] text-destructive font-bold uppercase tracking-tighter">Pلافوند dépassé</span>}
                  </div>
                </TableCell>
                <TableCell>
                  {customer.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${customer.phone}`} className="text-xs hover:text-primary hover:underline">{customer.phone}</a>
                    </div>
                  ) : <span className="text-xs text-muted-foreground italic">Aucun tél.</span>}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center">
                  {customer.lastActivityDate ? (
                    <div className="flex flex-col items-center">
                        <span className="text-xs">{formatDistanceToNow(new Date(customer.lastActivityDate), { addSuffix: true, locale: fr })}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{new Date(customer.lastActivityDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {customer.creditLimit ? formatCurrency(customer.creditLimit) : 'N/A'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell className={cn("text-right font-bold", customer.outstandingBalance > 0 ? "text-destructive" : "text-chart-quaternary")}>
                  {formatCurrency(customer.outstandingBalance)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {customer.phone && customer.outstandingBalance > 0 && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:text-green-700" 
                            onClick={() => handleWhatsAppReminder(customer)}
                            title="Tappel WhatsApp"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                    )}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary" 
                        onClick={() => onPayment(customer)}
                        disabled={customer.outstandingBalance <= 0}
                        title="Paiement"
                    >
                        <HandCoins className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => onStatement(customer)}
                        title="Imprimer Relevé"
                    >
                        <Printer className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.uuid}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Historique détaillé
                            </Link>
                        </DropdownMenuItem>
                        {isManagerOrAdmin && (
                            <>
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier le profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer le client
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
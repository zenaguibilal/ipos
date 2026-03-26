
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
import { MoreHorizontal, Edit, Trash2, FileText, Phone, DollarSign, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  selectedCustomers: Set<string>;
  onToggleCustomerSelection: (customerUuid: string) => void;
  onToggleSelectAll: () => void;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  selectedCustomers,
  onToggleCustomerSelection,
  onToggleSelectAll,
}: CustomerTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] px-4">
              <Checkbox
                checked={customers.length > 0 && selectedCustomers.size === customers.length}
                onCheckedChange={onToggleSelectAll}
                disabled={customers.length === 0 || !isManagerOrAdmin}
              />
            </TableHead>
            <TableHead>Nom du Client</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead className="hidden md:table-cell">Adresse</TableHead>
            <TableHead className="text-right">Limite Crédit</TableHead>
            <TableHead className="text-right">Total Dépensé</TableHead>
            <TableHead className="text-right">Solde Impayé</TableHead>
            <TableHead className="w-[50px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const isSelected = selectedCustomers.has(customer.uuid);
            return (
              <TableRow key={customer.uuid} className={cn(isSelected && "bg-muted/50")}>
                <TableCell className="px-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleCustomerSelection(customer.uuid)}
                    disabled={!isManagerOrAdmin}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/customers/${customer.uuid}`} className="hover:underline">
                    {customer.firstName} {customer.lastName}
                  </Link>
                </TableCell>
                <TableCell>
                  {customer.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{customer.phone}</span>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                    {customer.address || '-'}
                  </span>
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
                          Détails
                        </Link>
                      </DropdownMenuItem>
                      {isManagerOrAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(customer)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
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

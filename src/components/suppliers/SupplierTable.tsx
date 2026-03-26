
'use client';

import React from 'react';
import type { Supplier } from '@/lib/types';
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
import { MoreHorizontal, Edit, Trash2, Phone, MapPin, Wallet, User } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SupplierTable({
  suppliers,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-primary/10">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Nom du Fournisseur</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Contact</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Téléphone</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Adresse</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Solde Dû</TableHead>
            <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.uuid} className="hover:bg-primary/5 transition-colors border-primary/5">
              <TableCell className="font-bold text-base">
                {supplier.name}
              </TableCell>
              <TableCell className="font-medium text-muted-foreground">
                {supplier.contactPerson || '-'}
              </TableCell>
              <TableCell>
                {supplier.phone ? (
                    <a href={`tel:${supplier.phone}`} className="text-xs font-mono hover:text-primary transition-colors">{supplier.phone}</a>
                ) : '-'}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs italic opacity-70">
                {supplier.address || '-'}
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                    "font-black",
                    supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary"
                )}>
                    {formatCurrency(supplier.balance)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {isManagerOrAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="luxury-glass">
                      <DropdownMenuItem onClick={() => onEdit(supplier)} className="gap-2">
                        <Edit className="h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(supplier)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2">
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

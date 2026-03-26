
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
import { MoreHorizontal, Edit, Trash2, Phone, MapPin, Wallet, User, Eye } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  selectedSuppliers: Set<string>;
  onToggleSelection: (uuid: string) => void;
  onToggleAll: () => void;
}

export function SupplierTable({
  suppliers,
  onEdit,
  onDelete,
  selectedSuppliers,
  onToggleSelection,
  onToggleAll,
}: SupplierTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-primary/10">
            <TableHead className="w-12 px-4">
                <Checkbox checked={suppliers.length > 0 && selectedSuppliers.size === suppliers.length} onCheckedChange={onToggleAll} />
            </TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Nom du Fournisseur</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Contact</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Téléphone</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Solde Dû</TableHead>
            <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow key={supplier.uuid} className="hover:bg-primary/5 transition-colors border-primary/5 group">
              <TableCell className="px-4">
                <Checkbox checked={selectedSuppliers.has(supplier.uuid)} onCheckedChange={() => onToggleSelection(supplier.uuid)} />
              </TableCell>
              <TableCell className="font-bold text-base">
                <Link href={`/suppliers/${supplier.uuid}`} className="hover:text-primary hover:underline">{supplier.name}</Link>
              </TableCell>
              <TableCell className="font-medium text-muted-foreground">
                {supplier.contactPerson || '-'}
              </TableCell>
              <TableCell>
                {supplier.phone ? (
                    <a href={`tel:${supplier.phone}`} className="text-xs font-mono hover:text-primary transition-colors">{supplier.phone}</a>
                ) : '-'}
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
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:bg-primary/10 rounded-lg">
                    <Link href={`/suppliers/${supplier.uuid}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

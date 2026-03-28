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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import { formatCurrency, cn, safeToDate } from '@/lib/utils';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const companyProfile = useAppStore(state => state.profile);

  const handleWhatsApp = (e: React.MouseEvent, supplier: Supplier) => {
    e.stopPropagation();
    if (!supplier.phone) return;
    window.open(`https://wa.me/${supplier.phone}`, '_blank');
  };

  return (
    <div className="rounded-[2rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            <TableHead className="w-12 px-6 py-5">
                <Checkbox 
                    checked={suppliers.length > 0 && selectedSuppliers.size === suppliers.length} 
                    onCheckedChange={onToggleAll} 
                />
            </TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Identité Partenaire</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden md:table-cell">Contact & Tél</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground hidden lg:table-cell">Dernière Opération</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-8">Solde Dû</TableHead>
            <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow 
                key={supplier.uuid} 
                className={cn(
                    "hover:bg-primary/5 transition-colors border-white/5 group cursor-pointer",
                    selectedSuppliers.has(supplier.uuid) && "bg-primary/10"
                )}
                onClick={() => onToggleSelection(supplier.uuid)}
            >
              <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                <Checkbox checked={selectedSuppliers.has(supplier.uuid)} onCheckedChange={() => onToggleSelection(supplier.uuid)} />
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-sm text-primary shadow-inner group-hover:scale-110 transition-transform">
                        {supplier.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{supplier.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono opacity-60">ID: {supplier.uuid.substring(0,8)}</span>
                    </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <User className="h-3 w-3 text-primary opacity-40" />
                        {supplier.contactPerson || '-'}
                    </div>
                    {supplier.phone && (
                        <div className="flex items-center gap-2 text-[10px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                            <Phone className="h-2.5 w-2.5 text-primary/40" />
                            {supplier.phone}
                        </div>
                    )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2 text-[10px] font-medium opacity-60 uppercase font-black tracking-widest">
                    <Calendar className="h-3 w-3" />
                    {format(safeToDate(supplier.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                </div>
              </TableCell>
              <TableCell className="text-right pr-8">
                <span className={cn(
                    "text-base font-black tracking-tighter",
                    supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary"
                )}>
                    {formatCurrency(supplier.balance)}
                </span>
              </TableCell>
              <TableCell className="text-right px-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                    <Link href={`/suppliers/${supplier.uuid}`} title="Détails complets"><Eye className="h-4.5 w-4.5" /></Link>
                  </Button>
                  {supplier.phone && (
                    <Button variant="ghost" size="icon" onClick={(e) => handleWhatsApp(e, supplier)} className="h-9 w-9 rounded-xl hover:bg-green-500/10 text-green-500" title="WhatsApp">
                        <MessageSquare className="h-4.5 w-4.5" />
                    </Button>
                  )}
                  {isManagerOrAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10">
                          <MoreHorizontal className="h-4.5 w-4.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[160px]">
                        <DropdownMenuLabel className="text-[9px] font-black uppercase opacity-50 px-2 py-1">Souveraineté</DropdownMenuLabel>
                        <DropdownMenuItem asChild className="cursor-pointer focus:bg-primary/10 rounded-lg">
                            <Link href={`/suppliers/${supplier.uuid}`} className="flex items-center gap-2 font-bold py-2">
                                <ExternalLink className="h-4 w-4" /> Activité Live
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(supplier)} className="cursor-pointer focus:bg-primary/10 rounded-lg gap-2 font-bold py-2">
                          <Edit className="h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem onClick={() => onDelete(supplier)} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg gap-2 font-bold py-2">
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

'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-2xl border border-destructive/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-destructive/10">
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Description</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Catégorie</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Montant</TableHead>
            <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.uuid} className="hover:bg-destructive/5 transition-colors border-destructive/5">
              <TableCell className="text-[11px] font-mono font-bold">
                {format(new Date(expense.expenseDate), 'dd/MM/yyyy', { locale: fr })}
              </TableCell>
              <TableCell className="font-semibold truncate max-w-[250px]">
                {expense.description}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase font-black">
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-black text-destructive">{formatCurrency(expense.amount)}</span>
              </TableCell>
              <TableCell className="text-right">
                {isManagerOrAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="luxury-glass">
                      <DropdownMenuItem onClick={() => onEdit(expense)} className="gap-2">
                        <Edit className="h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2">
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
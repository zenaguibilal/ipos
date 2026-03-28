
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Calendar, Tag, Banknote, Clock, History } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  selectedExpenses?: Set<string>;
  onToggleSelection?: (uuid: string) => void;
  onToggleAll?: () => void;
}

export function ExpenseTable({
  expenses,
  onEdit,
  onDelete,
  selectedExpenses = new Set(),
  onToggleSelection,
  onToggleAll,
}: ExpenseTableProps) {
  const isManagerOrAdmin = useIsManagerOrAdmin();

  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="hover:bg-transparent border-white/5">
            {onToggleAll && (
                <TableHead className="w-12 px-6 py-5">
                    <Checkbox 
                        checked={expenses.length > 0 && selectedExpenses.size === expenses.length} 
                        onCheckedChange={onToggleAll} 
                        className="border-white/20"
                    />
                </TableHead>
            )}
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground py-6 px-8">Description du Flux</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Affectation Budgétaire</TableHead>
            <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground text-center">Date Effective</TableHead>
            <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground pr-10">Montant Net</TableHead>
            <TableHead className="w-[100px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-8">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const isSelected = selectedExpenses.has(expense.uuid);

            return (
              <TableRow 
                key={expense.uuid} 
                className={cn(
                    "hover:bg-destructive/5 transition-all border-white/5 cursor-pointer group",
                    isSelected && "bg-destructive/10"
                )}
                onClick={() => onToggleSelection?.(expense.uuid)}
              >
                {onToggleSelection && (
                    <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(expense.uuid)} className="border-white/20" />
                    </TableCell>
                )}
                <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center font-black text-destructive shadow-inner group-hover:scale-110 transition-transform">
                            <Banknote className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-sm tracking-tight text-foreground uppercase truncate max-w-[300px] group-hover:text-destructive transition-colors">
                                {expense.description}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground opacity-40">ID: {expense.uuid.substring(0,8)}</span>
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 text-[9px] font-black uppercase tracking-widest px-3 h-6">
                    <Tag className="h-2.5 w-2.5 mr-1.5 opacity-60" />
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black uppercase tracking-tighter">{format(new Date(expense.expenseDate), 'dd MMMM yyyy', { locale: fr })}</span>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground opacity-40 font-mono mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        SAISI LE {format(new Date(expense.createdAt!), 'dd/MM/yy HH:mm')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-10">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-black text-destructive tracking-tighter">
                        -{formatCurrency(expense.amount)}
                    </span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-30">Sortie de Caisse</span>
                  </div>
                </TableCell>
                <TableCell className="text-right px-8" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-white/10">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[180px] shadow-2xl border-white/10">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1.5 tracking-widest">Audit Flux</DropdownMenuLabel>
                            {isManagerOrAdmin && (
                                <>
                                    <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-xl py-3 font-bold gap-3">
                                        <Edit className="h-4 w-4 opacity-60" /> Rectifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl py-3 font-bold gap-3">
                                        <Trash2 className="h-4 w-4" /> Supprimer
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="rounded-xl py-3 font-bold gap-3 opacity-50 cursor-not-allowed">
                                <History className="h-4 w-4" /> Journal Logs
                            </DropdownMenuItem>
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

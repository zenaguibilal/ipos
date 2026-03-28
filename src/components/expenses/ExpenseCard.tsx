'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Calendar, Tag, Banknote, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

const ExpenseCardComponent = ({ expense, onEdit, onDelete, isSelected, onToggleSelection }: ExpenseCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    
    const handleCardClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[role="menu"]') || target.closest('[role="checkbox"]')) return;
        onToggleSelection();
    };

    return (
        <Card 
            className={cn(
                "flex flex-col transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 relative group luxury-glass border-destructive/10 bg-muted/10 overflow-hidden cursor-pointer",
                isSelected && "ring-2 ring-destructive/50 bg-destructive/[0.02] shadow-destructive/10"
            )}
            onClick={handleCardClick}
        >
            <div className={cn(
                "absolute top-3 left-3 z-10 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
                <Checkbox 
                    checked={isSelected} 
                    onCheckedChange={onToggleSelection} 
                    className="h-5 w-5 bg-background shadow-lg border-destructive/30 data-[state=checked]:bg-destructive" 
                />
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none duration-700">
                <Banknote className="h-32 w-32 rotate-12 text-destructive" />
            </div>

            <CardHeader className="pb-3 px-6 pt-6 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5 ml-6">
                        <CardTitle className="text-base font-black uppercase tracking-tight truncate max-w-[180px] group-hover:text-destructive transition-colors">
                            {expense.description}
                        </CardTitle>
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase font-black px-2 h-5 tracking-widest shadow-inner">
                            <Tag className="h-2.5 w-2.5 mr-1.5" />
                            {expense.category}
                        </Badge>
                    </div>
                    {isManagerOrAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="luxury-glass p-2 min-w-[160px] shadow-2xl border-white/10">
                                <DropdownMenuItem onClick={() => onEdit(expense)} className="rounded-lg font-bold gap-3 py-2.5">
                                    <Edit className="h-4 w-4 opacity-60" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg font-bold gap-3 py-2.5">
                                    <Trash2 className="h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="px-6 py-6 flex-grow space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-white/5 shadow-inner">
                    <Calendar className="h-4 w-4 text-destructive opacity-40" />
                    <span className="text-[11px] font-black uppercase tracking-widest opacity-70">
                        {format(new Date(expense.expenseDate), 'd MMMM yyyy', { locale: fr })}
                    </span>
                </div>
                {expense.createdAt && (
                    <div className="flex items-center text-[9px] text-muted-foreground italic gap-2 px-1 opacity-40">
                        <Clock className="h-3 w-3" />
                        <span>Saisi le {format(new Date(expense.createdAt), 'Pp', { locale: fr })}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-destructive/5 p-5 border-t border-destructive/10 mt-auto relative z-10">
                 <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive/70">Flux Sortant</span>
                    <span className="text-2xl font-black text-destructive tracking-tighter">-{formatCurrency(expense.amount)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export const ExpenseCard = React.memo(ExpenseCardComponent);

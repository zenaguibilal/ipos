'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
}

const ExpenseCardComponent = ({ expense, onEdit, onDelete }: ExpenseCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    
    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 luxury-glass border-destructive/10 group relative overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold leading-tight group-hover:text-destructive transition-colors">
                            {expense.description}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase font-black px-1.5 h-5">
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {expense.category}
                            </Badge>
                        </div>
                    </div>
                    {isManagerOrAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="luxury-glass">
                                <DropdownMenuItem onClick={() => onEdit(expense)}>
                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                <div className="flex items-center text-muted-foreground gap-2 font-mono text-[10px] uppercase font-bold opacity-70">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(expense.expenseDate), 'd MMMM yyyy', { locale: fr })}</span>
                </div>
            </CardContent>
            <CardFooter className="bg-destructive/5 p-4 border-t border-destructive/10 mt-auto">
                 <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Montant Sorti</span>
                    <span className="text-xl font-black text-destructive">{formatCurrency(expense.amount)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export const ExpenseCard = React.memo(ExpenseCardComponent);
'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Banknote, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface ExpenseCardProps {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
}

const ExpenseCardComponent = ({ expense, onEdit, onDelete }: ExpenseCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">{expense.description}</CardTitle>
                    {isManagerOrAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(expense)}>
                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(expense)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                 <div className="flex items-center text-muted-foreground gap-2">
                    <Tag className="h-4 w-4" />
                    <span className="font-medium">{expense.category}</span>
                </div>
                <div className="flex items-center text-muted-foreground gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(expense.expenseDate, 'd MMM yyyy', { locale: fr })}</span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                 <div className="flex justify-between items-center bg-destructive/10 text-destructive p-3 rounded-lg w-full">
                    <span className="font-semibold flex items-center gap-2"><Banknote className="h-4 w-4"/> Montant</span>
                    <span className="text-xl font-bold">{formatCurrency(expense.amount)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export const ExpenseCard = React.memo(ExpenseCardComponent);

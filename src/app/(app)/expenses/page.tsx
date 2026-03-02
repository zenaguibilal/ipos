'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseCardSkeleton } from '@/components/expenses/ExpenseCardSkeleton';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function ExpensesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
    });

    const expenses = useLiveQuery(
        () => dataService.getExpenses({ 
            category: selectedCategory === 'all' ? undefined : selectedCategory,
            from: dateRange?.from,
            to: dateRange?.to
        }),
        [selectedCategory, dateRange],
        []
    );
    
    const categories = useLiveQuery(() => dataService.getExpenseCategories(), [], []);
    
    const isLoading = expenses === undefined || categories === undefined;

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsExpenseDialogOpen(true);
    };

    const handleDeleteExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDeleteDialogOpen(true);
    };

    const totalExpenses = useMemo(() => {
        if (!expenses) return 0;
        return expenses.reduce((acc, expense) => acc + expense.amount, 0);
    }, [expenses]);
    
    const renderSkeletons = () => (
        [...Array(6)].map((_, i) => <ExpenseCardSkeleton key={i} />)
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderSkeletons()}
                </div>
            );
        }

        if (expenses.length === 0) {
            return (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucune dépense trouvée</h3>
                    <p className="text-muted-foreground mt-2">Commencez par ajouter une nouvelle dépense.</p>
                     <Button className="mt-4" onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une dépense
                    </Button>
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {expenses.map(e => (
                    <ExpenseCard 
                        key={e.id} 
                        expense={e} 
                        onEdit={handleEditExpense} 
                        onDelete={handleDeleteExpense}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Gestion des Dépenses</h1>
                    <p className="text-muted-foreground">Suivez et gérez toutes les charges de votre entreprise.</p>
                </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button className="w-full sm:w-auto" onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Total des Dépenses pour la Période</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtrer par catégorie ({selectedCategory === 'all' ? 'Toutes' : selectedCategory})
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Catégories</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={selectedCategory === 'all'}
                            onCheckedChange={() => setSelectedCategory('all')}
                        >Toutes</DropdownMenuCheckboxItem>
                         {categories.map(cat => (
                             <DropdownMenuCheckboxItem
                                key={cat}
                                checked={selectedCategory === cat}
                                onCheckedChange={() => setSelectedCategory(cat)}
                            >{cat}</DropdownMenuCheckboxItem>
                         ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>
            
            <div>
               {renderContent()}
            </div>

            <ExpenseDialog 
                isOpen={isExpenseDialogOpen}
                onOpenChange={setIsExpenseDialogOpen}
                expense={selectedExpense}
            />
            <DeleteExpenseDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                expense={selectedExpense}
            />
        </div>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { expenseService } from '@/services/expense.service';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';

export default function ExpensesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [expenses, setExpenses] = useState<Expense[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);

    const isLoading = expenses === undefined || categories === undefined;
    
    const fetchExpenses = useCallback(async () => {
         if (!isMounted || !dateRange?.from || !dateRange?.to) return;
        try {
            const data = await expenseService.filter({
                category: selectedCategory,
                from: dateRange.from,
                to: dateRange.to
            });
            setExpenses(data);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger les dépenses.");
        }
    }, [isMounted, selectedCategory, dateRange]);
    
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const fetchCategories = useCallback(async () => {
        try {
            const cats = await expenseService.getCategories();
            setCategories(cats);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de charger les catégories de dépenses.");
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories])

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsExpenseDialogOpen(true);
    };

    const handleDeleteExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDeleteDialogOpen(true);
    };
    
    const onDialogSuccess = () => {
        fetchExpenses();
        fetchCategories(); // Re-fetch categories in case a new one was added via "Autre"
    }

    const totalExpenses = expenses ? expenses.reduce((acc, expense) => acc + expense.amount, 0) : 0;
    
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent><CardFooter><Skeleton className="h-14 w-full" /></CardFooter></Card>)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (!expenses || expenses.length === 0) {
            return (
                <EmptyState
                    icon={Filter}
                    title="Aucune dépense trouvée"
                    description="Commencez par ajouter une nouvelle dépense ou ajustez vos filtres."
                >
                     <Button onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une dépense
                    </Button>
                </EmptyState>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {expenses.map(e => (
                    <ExpenseCard 
                        key={e.uuid} 
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
            <PageHeader
                title="Gestion des Dépenses"
                description="Suivez et gérez toutes les charges de votre entreprise."
            >
                <Button onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                </Button>
            </PageHeader>

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
                         {categories && categories.map(cat => (
                             <DropdownMenuCheckboxItem
                                key={cat}
                                checked={selectedCategory === cat}
                                onCheckedChange={() => setSelectedCategory(cat)}
                            >{cat}</DropdownMenuCheckboxItem>
                         ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DateRangePicker date={dateRange} setDate={setDate} />
            </div>
            
            <div>
               {renderContent()}
            </div>

            <ExpenseDialog 
                isOpen={isExpenseDialogOpen}
                onOpenChange={setIsExpenseDialogOpen}
                expense={selectedExpense}
                onSuccess={onDialogSuccess}
                existingCategories={categories || []}
            />
            <DeleteExpenseDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                expense={selectedExpense}
                onSuccess={fetchExpenses}
            />
        </div>
    );
}

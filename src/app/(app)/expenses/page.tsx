'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Receipt, MoreHorizontal, Download, ChevronDown, ListFilter, Banknote } from 'lucide-react';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { safeToDate } from '@/lib/utils';
import { format, subDays, startOfDay, endOfMonth, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { DateRange } from 'react-day-picker';
import dynamic from 'next/dynamic';
import { ExpenseCardSkeleton } from '@/components/expenses/ExpenseCardSkeleton';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { useDebounce } from '@/hooks/useDebounce';
import { Dexie } from 'dexie';

const ExpenseDialog = dynamic(() => import('@/components/expenses/ExpenseDialog'), { ssr: false });
const DeleteExpenseDialog = dynamic(() => import('@/components/expenses/DeleteExpenseDialog'), { ssr: false });

export const expenseCategories: ExpenseCategory[] = ['Loyer', 'Salaires', 'Fournisseurs', 'Services Publics', 'Marketing', 'Maintenance', 'Autre'];

export default function ExpensesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const now = new Date();
        return { from: startOfMonth(now), to: endOfMonth(now) };
    });

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        const savedCategory = localStorage.getItem('expenses_category_filter');
        if (savedCategory) setCategoryFilter(savedCategory);
        const savedSearch = localStorage.getItem('expenses_search_query');
        if (savedSearch !== null) setSearchQuery(savedSearch);
    }, []);

    useEffect(() => { localStorage.setItem('expenses_category_filter', categoryFilter); }, [categoryFilter]);
    useEffect(() => { localStorage.setItem('expenses_search_query', searchQuery); }, [searchQuery]);
    useEffect(() => { if (dateRange) localStorage.setItem('expenses_date_range', JSON.stringify(dateRange)); }, [dateRange]);

    const expenses = useLiveQuery(() => {
        const from = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
        const to = dateRange?.to ? endOfMonth(dateRange.to) : new Date();

        if (categoryFilter === 'all') {
            return db.expenses.where('expenseDate').between(from, to, true, true).reverse().toArray();
        } else {
            return db.expenses.where('[category+expenseDate]').between([categoryFilter, from], [categoryFilter, to], true, true).reverse().toArray();
        }
    }, [dateRange, categoryFilter]);

    const { filteredExpenses, totalExpensesValue, expensesCount } = useMemo(() => {
        if (!expenses) return { filteredExpenses: [], totalExpensesValue: 0, expensesCount: 0 };
        
        const filtered = debouncedSearchQuery
            ? expenses.filter(e => e.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
            : expenses;

        const totalValue = filtered.reduce((sum, e) => sum + e.amount, 0);
        return { filteredExpenses: filtered, totalExpensesValue: totalValue, expensesCount: filtered.length };
    }, [expenses, debouncedSearchQuery]);
    
    const expensesByMonth = useMemo(() => {
        return filteredExpenses.reduce((acc, expense) => {
            const monthKey = format(safeToDate(expense.expenseDate), 'MMMM yyyy', { locale: fr });
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(expense);
            return acc;
        }, {} as Record<string, Expense[]>);
    }, [filteredExpenses]);


    const handleAddClick = () => {
        setSelectedExpense(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDialogOpen(true);
    };
    
    const handleExport = () => {
        if (filteredExpenses.length === 0) {
            toast.info("Aucune dépense à exporter.");
            return;
        }
        const dataToExport = filteredExpenses.map(e => ({
            'Date': format(safeToDate(e.expenseDate), 'yyyy-MM-dd'),
            'Description': e.description,
            'Catégorie': e.category,
            'Montant': e.amount,
        }));
        
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'export_depenses.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Liste des dépenses exportée avec succès.");
    };

    const isLoading = expenses === undefined;

    return (
        <>
            <ExpenseDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} expense={selectedExpense} />
            <DeleteExpenseDialog isOpen={!!expenseToDelete} onOpenChange={(isOpen) => !isOpen && setExpenseToDelete(null)} expense={expenseToDelete} />
            
            <main className="flex-1 overflow-auto p-4 sm:p-6">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion des Dépenses</h1>
                        <p className="text-muted-foreground">Suivez toutes les charges de votre commerce.</p>
                    </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <DateRangePicker date={dateRange} setDate={setDateRange} />
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline">Actions <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Exporter en CSV</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button onClick={handleAddClick}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une dépense
                        </Button>
                    </div>
                </div>

                 <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Dépenses (période)</CardTitle><Receipt className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{expensesCount}</div></CardContent></Card>
                    <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Montant Total (période)</CardTitle><Banknote className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{totalExpensesValue.toFixed(1)} DA</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher par description..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 w-full" />
                            </div>
                             <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]">
                                <option value="all">Toutes les catégories</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <ExpenseCardSkeleton key={i} />)}
                            </div>
                         ) : Object.keys(expensesByMonth).length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-md border-2 border-dashed border-border bg-card">
                                <p className="text-muted-foreground">
                                    {expenses && expenses.length > 0 ? "Aucune dépense ne correspond à vos filtres." : "Aucune dépense trouvée. Commencez par en ajouter une."}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(expensesByMonth).map(([month, monthExpenses]) => (
                                    <div key={month}>
                                        <h3 className="text-lg font-semibold capitalize mb-4">{month}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {monthExpenses.map((expense) => (
                                                <ExpenseCard key={expense.id} expense={expense} onEdit={handleEditClick} onDelete={setExpenseToDelete} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         )}
                    </CardContent>
                </Card>
            </main>
        </>
    )
}

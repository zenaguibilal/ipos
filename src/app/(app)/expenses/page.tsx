
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Search, FileUp, TrendingDown, RefreshCw } from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { CsvImporter } from '@/lib/csv-utils';

/**
 * @fileOverview Expense Page (State Singularity Enforcement)
 * تم توحيد إدارة الحالة لتكون عبر Zustand Store حصرياً.
 */

export default function ExpensesPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { expenses, isLoading, viewMode, categories } = useAppStore(state => ({
        expenses: state.expenses,
        isLoading: state.isLoading.expenses,
        viewMode: state.expenseViewMode,
        categories: state.expenseCategories
    }));
    const { refreshExpenses, refreshExpenseCategories, setExpenseViewMode } = useAppActions();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const fetchExpenses = useCallback(() => {
        if (!isMounted || !dateRange?.from || !dateRange?.to) return;
        refreshExpenses({
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString()
        });
    }, [isMounted, dateRange, refreshExpenses]);
    
    useEffect(() => {
        fetchExpenses();
        refreshExpenseCategories();
    }, [fetchExpenses, refreshExpenseCategories]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.description.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }, [expenses, debouncedSearch]);

    const totalAmount = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);

    const handleExport = () => {
        if (!filteredExpenses.length) return;
        CsvImporter.exportExpenses(filteredExpenses);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Flux de Trésorerie Sortant" description="Contrôle et classification des charges opérationnelles.">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={!filteredExpenses.length} className="luxury-glass border-white/10">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter CSV
                    </Button>
                    <Button onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }} disabled={!isManagerOrAdmin} className="bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20 rounded-xl">
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="luxury-glass bg-destructive/5 border-destructive/20 relative group overflow-hidden">
                    <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume Sorties</CardTitle></CardHeader>
                    <CardContent><p className="text-4xl font-black text-destructive">{formatCurrency(totalAmount)}</p><p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase opacity-60">Total période sélectionnée</p></CardContent>
                </Card>
                
                <div className="lg:col-span-2 flex items-end gap-3">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par description..." className="pl-10 h-11 luxury-glass border-white/10 rounded-xl" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <DateRangePicker date={dateRange} setDate={setDate} />
                    <Button variant="ghost" size="icon" className="h-11 w-11 luxury-glass" onClick={fetchExpenses} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="min-h-[400px]">
               {isLoading && expenses.length === 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
               ) : filteredExpenses.length === 0 ? (
                   <EmptyState icon={TrendingDown} title="Aucune dépense" description="Enregistrez vos frais pour un suivi comptable précis." />
               ) : (
                   viewMode === 'list' ? (
                       <ExpenseTable expenses={filteredExpenses} onEdit={(e) => { setSelectedExpense(e); setIsExpenseDialogOpen(true); }} onDelete={(e) => { setSelectedExpense(e); setIsDeleteDialogOpen(true); }} />
                   ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredExpenses.map(e => <ExpenseCard key={e.uuid} expense={e} onEdit={(ex) => { setSelectedExpense(ex); setIsExpenseDialogOpen(true); }} onDelete={(ex) => { setSelectedExpense(ex); setIsDeleteDialogOpen(true); }} />)}
                       </div>
                   )
               )}
            </div>

            {isManagerOrAdmin && (
                <>
                    <ExpenseDialog isOpen={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen} expense={selectedExpense} onSuccess={fetchExpenses} existingCategories={categories} />
                    <DeleteExpenseDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} expense={selectedExpense} onSuccess={fetchExpenses} />
                </>
            )}
        </div>
    );
}

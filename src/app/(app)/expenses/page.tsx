
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
    Plus, Search, FileUp, TrendingDown, RefreshCw, 
    RotateCcw, LayoutGrid, List, X, Filter, ChevronDown, 
    Trash2, Activity, Banknote, Calendar, ArrowRight, Info, ShieldCheck
} from 'lucide-react';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { ExpenseTable } from '@/components/expenses/ExpenseTable';
import { ExpenseStats } from '@/components/expenses/ExpenseStats';
import ExpenseDialog from '@/components/expenses/ExpenseDialog';
import DeleteExpenseDialog from '@/components/expenses/DeleteExpenseDialog';
import { DeleteMultipleExpensesDialog } from '@/components/expenses/DeleteMultipleExpensesDialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useDateRange } from '@/hooks/useDateRange';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { useAppStore, useIsManagerOrAdmin, useAppActions } from '@/stores/appStore';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { CsvImporter } from '@/lib/csv-utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

/**
 * @fileOverview Expense Ledger (Sovereign Authority - Finalized Perfection)
 * المركز السيادي للتحكم في التدفقات النقدية الخارجة وتدقيق الأعباء التشغيلية.
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
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { dateRange, setDate, isMounted } = useDateRange(29);
    
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [selectedExpenseUuids, setSelectedExpenseUuids] = useState<Set<string>>(new Set());

    const fetchExpenses = useCallback(() => {
        if (!isMounted || !dateRange?.from || !dateRange?.to) return;
        refreshExpenses({
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
            category: selectedCategory
        });
    }, [isMounted, dateRange, selectedCategory, refreshExpenses]);
    
    useEffect(() => {
        fetchExpenses();
        refreshExpenseCategories();
    }, [fetchExpenses, refreshExpenseCategories]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => 
            e.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            e.category.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [expenses, debouncedSearch]);

    const handleToggleSelection = (uuid: string) => {
        setSelectedExpenseUuids(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uuid)) newSet.delete(uuid);
            else newSet.add(uuid);
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedExpenseUuids.size === filteredExpenses.length) {
            setSelectedExpenseUuids(new Set());
        } else {
            setSelectedExpenseUuids(new Set(filteredExpenses.map(e => e.uuid)));
        }
    };

    const handleExport = () => {
        if (!filteredExpenses.length) return;
        CsvImporter.exportExpenses(filteredExpenses);
        toast.success("Registre des charges exporté.");
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedExpenseUuids(new Set());
        fetchExpenses();
    };

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Souveraineté des Charges" 
                description="Audit chronologique des flux sortants, classification و maîtrise des dépenses."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={!filteredExpenses.length} className="luxury-glass border-primary/20 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-3">
                        <FileUp className="h-4 w-4" /> Export CSV
                    </Button>
                    {isManagerOrAdmin && (
                        <Button 
                            onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }} 
                            className="bg-destructive hover:bg-destructive/90 shadow-2xl shadow-destructive/20 rounded-2xl h-12 px-10 font-black uppercase text-[10px] tracking-[0.2em] gap-3 group"
                        >
                            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
                            Nouvelle Dépense
                        </Button>
                    )}
                </div>
            </PageHeader>

            <ExpenseStats expenses={expenses} isLoading={isLoading} />

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-grow group">
                    <div className="absolute inset-0 bg-destructive/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive opacity-40 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                        placeholder="Rechercher par description أو تصنيف المصروف..."
                        className="pl-12 h-14 luxury-glass rounded-2xl bg-background/40 border-white/5 focus:border-destructive/40 focus:ring-0 font-bold text-sm relative z-10 shadow-inner"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-20">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto luxury-glass p-2 bg-muted/20 border-white/5 shadow-inner">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 rounded-xl border-white/5 font-bold text-xs gap-2 min-w-[160px] justify-between shadow-sm">
                                <span className="flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5 text-destructive" />
                                    {selectedCategory === 'all' ? 'Tous les postes' : selectedCategory}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass min-w-[200px] p-2">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black opacity-50 px-2 py-1.5 tracking-widest">Nomenclature Budgétaire</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                                <DropdownMenuRadioItem value="all" className="font-bold py-2.5 rounded-lg">Tous les flux</DropdownMenuRadioItem>
                                {categories.map(cat => (
                                    <DropdownMenuRadioItem key={cat} value={cat} className="font-bold py-2.5 rounded-lg">{cat}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />

                    <div className="flex items-center gap-1 rounded-xl bg-background/40 p-1 border border-white/10 shadow-inner">
                        <Button variant={viewMode === 'grid' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setExpenseViewMode('grid')}>
                            <LayoutGrid className="h-4.5 w-4.5"/>
                        </Button>
                        <Button variant={viewMode === 'list' ? 'secondary': 'ghost'} size="icon" className="h-9 w-9 rounded-lg" onClick={() => setExpenseViewMode('list')}>
                            <List className="h-4.5 w-4.5"/>
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-destructive/10" onClick={handleResetFilters} title="Réinitialiser">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <Button variant="ghost" size="icon" className="h-10 w-10 luxury-glass hover:bg-primary/10" onClick={fetchExpenses} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 text-primary", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {selectedExpenseUuids.size > 0 && (
                <div className="flex justify-between items-center bg-destructive/5 border border-destructive/20 rounded-[1.5rem] p-4 animate-in slide-in-from-top-4 duration-500 shadow-xl">
                    <div className="flex items-center gap-4">
                        <Badge variant="destructive" className="px-4 py-1.5 rounded-xl font-black text-[10px] tracking-widest uppercase">
                            {selectedExpenseUuids.size} ligne(s) sélectionnée(s)
                        </Badge>
                        <p className="text-[9px] font-black uppercase tracking-widest text-destructive opacity-60">Actions de masse sur le grand livre</p>
                    </div>
                    {isManagerOrAdmin && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => setIsBulkDeleteOpen(true)} 
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-6 shadow-lg shadow-destructive/20"
                        >
                            <Trash2 className="h-4 w-4" /> 
                            Révocation Massive
                        </Button>
                    )}
                </div>
            )}

            <div className="min-h-[500px]">
               {isLoading && expenses.length === 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                       {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />)}
                   </div>
               ) : filteredExpenses.length === 0 ? (
                   <EmptyState 
                        icon={TrendingDown} 
                        title="Aucun flux de charge détecté" 
                        description={searchQuery || selectedCategory !== 'all' ? "Aucune dépense ne correspond à vos filtres actuels." : "Le registre des charges est vierge. Enregistrez vos frais pour un suivi comptable précis."} 
                        className="py-32 luxury-glass border-white/5 bg-muted/5 rounded-[3rem]"
                    >
                        {!searchQuery && selectedCategory === 'all' && isManagerOrAdmin && (
                            <Button onClick={() => setIsExpenseDialogOpen(true)} className="rounded-2xl px-12 h-14 bg-destructive shadow-2xl shadow-destructive/20 font-black uppercase text-[11px] tracking-widest">
                                <Plus className="h-4 w-4 mr-2" />
                                Initialiser une charge
                            </Button>
                        )}
                    </EmptyState>
               ) : (
                   <div className="animate-in slide-in-from-bottom-4 duration-1000">
                        {viewMode === 'list' ? (
                            <ExpenseTable 
                                expenses={filteredExpenses} 
                                onEdit={(e) => { setSelectedExpense(e); setIsExpenseDialogOpen(true); }} 
                                onDelete={(e) => { setSelectedExpense(e); setIsDeleteDialogOpen(true); }}
                                selectedExpenses={selectedExpenseUuids}
                                onToggleSelection={handleToggleSelection}
                                onToggleAll={handleSelectAll}
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                                {filteredExpenses.map(e => (
                                    <ExpenseCard 
                                        key={e.uuid} 
                                        expense={e} 
                                        onEdit={(ex) => { setSelectedExpense(ex); setIsExpenseDialogOpen(true); }} 
                                        onDelete={(ex) => { setSelectedExpense(ex); setIsDeleteDialogOpen(true); }}
                                        isSelected={selectedExpenseUuids.has(e.uuid)}
                                        onToggleSelection={() => handleToggleSelection(e.uuid)}
                                    />
                                ))}
                            </div>
                        )}
                   </div>
               )}
            </div>

            <div className="p-10 rounded-[3rem] bg-destructive/5 border border-destructive/10 flex flex-col md:flex-row items-center justify-between gap-8 mt-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-destructive/10 rounded-2xl">
                        <Info className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-tight italic">Optimisation des Flux</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                            Une surveillance rigoureuse des charges est essentielle pour maintenir une marge nette saine. Catégorisez précisément chaque sortie pour un audit financier déterministe.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-10 px-6 rounded-xl border-destructive/20 text-destructive font-black uppercase text-[9px] tracking-widest bg-background/40">
                        <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                        Audit iPOS Activé
                    </Badge>
                </div>
            </div>

            {isManagerOrAdmin && (
                <>
                    <ExpenseDialog 
                        isOpen={isExpenseDialogOpen} 
                        onOpenChange={setIsExpenseDialogOpen} 
                        expense={selectedExpense} 
                        onSuccess={fetchExpenses} 
                        existingCategories={categories} 
                    />
                    <DeleteExpenseDialog 
                        isOpen={isDeleteDialogOpen} 
                        onOpenChange={setIsDeleteDialogOpen} 
                        expense={selectedExpense} 
                        onSuccess={fetchExpenses} 
                    />
                    <DeleteMultipleExpensesDialog 
                        isOpen={isBulkDeleteOpen} 
                        onOpenChange={setIsBulkDeleteOpen} 
                        expenseUuids={Array.from(selectedExpenseUuids)} 
                        onSuccess={() => { setSelectedExpenseUuids(new Set()); fetchExpenses(); }} 
                    />
                </>
            )}
        </div>
    );
}

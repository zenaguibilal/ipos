'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService } from '@/services/expense.service';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, FileUp, TrendingDown, Tag, X, RefreshCw, Loader2, PieChart } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

export default function ExpensesPage() {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { dateRange, setDate, isMounted } = useDateRange(29);
    const [expenses, setExpenses] = useState<Expense[] | undefined>(undefined);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isLoading = expenses === undefined || categories === undefined;
    
    const fetchExpenses = useCallback(async (manual = false) => {
         if (!isMounted || !dateRange?.from || !dateRange?.to) return;
        if (manual) setIsRefreshing(true);
        setExpenses(undefined);
        try {
            const data = await expenseService.filter({
                category: selectedCategory,
                from: dateRange.from,
                to: dateRange.to
            });
            setExpenses(data);
        } catch (error: any) {
            toast.error("Impossible de charger les dépenses.", { description: error.message });
        } finally {
            if (manual) setIsRefreshing(false);
        }
    }, [isMounted, selectedCategory, dateRange]);
    
    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const fetchCategories = useCallback(async () => {
        try {
            const cats = await expenseService.getCategories();
            setCategories(cats);
        } catch (error: any) {
            toast.error("Impossible de charger les catégories de dépenses.", { description: error.message });
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories])

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        if (!debouncedSearch.trim()) return expenses;
        const q = debouncedSearch.toLowerCase().trim();
        return expenses.filter(e => e.description.toLowerCase().includes(q));
    }, [expenses, debouncedSearch]);

    const statsByCategory = useMemo(() => {
        if (!expenses) return [];
        const map = new Map<string, number>();
        expenses.forEach(e => {
            map.set(e.category, (map.get(e.category) || 0) + e.amount);
        });
        return Array.from(map.entries())
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
    }, [expenses]);

    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    }, [filteredExpenses]);

    const handleEditExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsExpenseDialogOpen(true);
    };

    const handleDeleteExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsDeleteDialogOpen(true);
    };
    
    const handleExport = async () => {
        if (!filteredExpenses.length) return;
        try {
            await expenseService.exportToCSV(filteredExpenses);
            toast.success("Registre des dépenses exporté.");
        } catch (e) {
            toast.error("Échec de l'exportation.");
        }
    }

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
    );

    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (filteredExpenses.length === 0) {
            return (
                <EmptyState
                    icon={TrendingDown}
                    title="Aucune dépense trouvée"
                    description={searchQuery ? "Aucun résultat pour cette recherche." : "Commencez par ajouter une nouvelle dépense pour votre commerce."}
                >
                     {!searchQuery && (
                        <Button 
                            onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                            disabled={!isManagerOrAdmin}
                            className="luxury-glass bg-primary/10 border-primary/20 text-primary"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter une dépense
                        </Button>
                     )}
                </EmptyState>
            );
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExpenses.map(e => (
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
                description="Suivez et analysez toutes les charges de votre entreprise."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={handleExport} disabled={!filteredExpenses.length} className="border-primary/20 luxury-glass">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter
                    </Button>
                    <Button 
                        onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                        disabled={!isManagerOrAdmin}
                        className="bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats Card */}
                <Card className="luxury-glass bg-destructive/5 border-destructive/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-16 w-16 text-destructive" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dépenses Totales (Période)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-black text-destructive">{formatCurrency(totalAmount)}</p>
                        <p className="text-xs text-muted-foreground mt-2">{filteredExpenses.length} opérations enregistrées</p>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="lg:col-span-2 luxury-glass border-primary/10">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-bold uppercase">Répartition par Catégorie</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {statsByCategory.slice(0, 6).map((cat, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase opacity-70">
                                        <span className="truncate">{cat.name}</span>
                                        <span>{Math.round((cat.total / totalAmount) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${(cat.total / totalAmount) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs font-black text-primary">{formatCurrency(cat.total)}</p>
                                </div>
                            ))}
                            {statsByCategory.length === 0 && <p className="col-span-full text-center text-xs text-muted-foreground py-4">Aucune donnée disponible</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher une dépense par description..."
                        className="pl-10 h-11 border-primary/10 bg-background/50 focus:border-primary/30 luxury-glass rounded-xl"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 min-w-[160px] border-primary/10 luxury-glass rounded-xl justify-between">
                                <span className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-primary" />
                                    {selectedCategory === 'all' ? 'Toutes catégories' : selectedCategory}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 luxury-glass">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-50">Filtrer par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={selectedCategory === 'all'}
                                onCheckedChange={() => setSelectedCategory('all')}
                            >Toutes les catégories</DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            {categories?.map(cat => (
                                <DropdownMenuCheckboxItem
                                    key={cat}
                                    checked={selectedCategory === cat}
                                    onCheckedChange={() => setSelectedCategory(cat)}
                                >{cat}</DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DateRangePicker date={dateRange} setDate={setDate} />
                    
                    <Button variant="ghost" size="icon" className="h-11 w-11 hover:bg-primary/10 rounded-xl luxury-glass" onClick={() => fetchExpenses(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>
            
            <div className="min-h-[400px]">
               {renderContent()}
            </div>
            
            {isManagerOrAdmin && (
                <>
                    <ExpenseDialog 
                        isOpen={isExpenseDialogOpen}
                        onOpenChange={setIsExpenseDialogOpen}
                        expense={selectedExpense}
                        onSuccess={() => { fetchExpenses(); fetchCategories(); }}
                        existingCategories={categories || []}
                    />
                    <DeleteExpenseDialog 
                        isOpen={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        expense={selectedExpense}
                        onSuccess={fetchExpenses}
                    />
                </>
            )}
        </div>
    );
}

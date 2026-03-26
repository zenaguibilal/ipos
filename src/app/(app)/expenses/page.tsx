'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { expenseService } from '@/services/expense.service';
import type { Expense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Search, FileUp, TrendingDown, Tag, X, RefreshCw, Loader2, BarChart as BarChartIcon, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns';

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
    const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<string[] | undefined>(undefined);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isLoading = expenses === undefined || categories === undefined;
    
    const fetchExpenses = useCallback(async (manual = false) => {
        if (!isMounted || !dateRange?.from || !dateRange?.to) return;
        if (manual) setIsRefreshing(true);
        
        try {
            // Fetch current period
            const currentData = await expenseService.filter({
                category: selectedCategory,
                from: dateRange.from,
                to: dateRange.to
            });
            setExpenses(currentData);

            // Fetch previous period for trend analysis
            const duration = dateRange.to.getTime() - dateRange.from.getTime();
            const prevTo = new Date(dateRange.from.getTime() - 1);
            const prevFrom = new Date(prevTo.getTime() - duration);
            
            const previousData = await expenseService.filter({
                category: selectedCategory,
                from: prevFrom,
                to: prevTo
            });
            setPrevExpenses(previousData);

        } catch (error: any) {
            toast.error("Impossible de charger les dépenses.", { description: error.message });
            setExpenses([]);
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
            toast.error("Impossible de charger les catégories.");
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        if (!debouncedSearch.trim()) return expenses;
        const q = debouncedSearch.toLowerCase().trim();
        return expenses.filter(e => e.description.toLowerCase().includes(q));
    }, [expenses, debouncedSearch]);

    const totalAmount = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
    const prevTotalAmount = useMemo(() => prevExpenses.reduce((acc, e) => acc + e.amount, 0), [prevExpenses]);
    
    const trendPercentage = useMemo(() => {
        if (prevTotalAmount === 0) return totalAmount > 0 ? 100 : 0;
        return ((totalAmount - prevTotalAmount) / prevTotalAmount) * 100;
    }, [totalAmount, prevTotalAmount]);

    const chartData = useMemo(() => {
        if (!expenses) return [];
        const map = new Map<string, number>();
        expenses.forEach(e => {
            map.set(e.category, (map.get(e.category) || 0) + e.amount);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [expenses]);

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
    };

    const setDateShortcut = (type: 'today' | 'yesterday' | 'week' | 'month') => {
        const now = new Date();
        switch (type) {
            case 'today':
                setDate({ from: startOfDay(now), to: endOfDay(now) });
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                setDate({ from: startOfDay(yesterday), to: endOfDay(yesterday) });
                break;
            case 'week':
                setDate({ from: startOfDay(subDays(now, 6)), to: endOfDay(now) });
                break;
            case 'month':
                setDate({ from: startOfMonth(now), to: endOfDay(now) });
                break;
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
                </div>
            );
        }

        if (filteredExpenses.length === 0) {
            return (
                <EmptyState
                    icon={TrendingDown}
                    title="Aucune dépense trouvée"
                    description={searchQuery ? "Aucun résultat pour cette recherche." : "Commencez par ajouter une nouvelle dépense."}
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
                    <Button variant="outline" onClick={handleExport} disabled={!filteredExpenses.length} className="border-primary/20 luxury-glass h-11">
                        <FileUp className="mr-2 h-4 w-4" /> Exporter CSV
                    </Button>
                    <Button 
                        onClick={() => { setSelectedExpense(null); setIsExpenseDialogOpen(true); }}
                        disabled={!isManagerOrAdmin}
                        className="bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20 h-11 px-6 rounded-xl"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Dépense
                    </Button>
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Global Stats with Trends */}
                <Card className="luxury-glass bg-destructive/5 border-destructive/20 overflow-hidden relative group h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-16 w-16 text-destructive" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total des Sorties</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-10 w-32" /> : (
                            <>
                                <p className="text-4xl font-black text-destructive">{formatCurrency(totalAmount)}</p>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black uppercase",
                                        trendPercentage > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                                    )}>
                                        {trendPercentage > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        {Math.abs(trendPercentage).toFixed(1)}%
                                    </div>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">vs. période précédente</span>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Analytical Breakdown Chart */}
                <Card className="lg:col-span-2 luxury-glass border-primary/10 h-full overflow-hidden">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BarChartIcon className="h-4 w-4 text-primary" />
                            <CardTitle className="text-sm font-bold uppercase">Répartition par Catégorie</CardTitle>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{chartData.length} Catégories</span>
                    </CardHeader>
                    <CardContent className="h-44 pt-4">
                        {isLoading ? <Skeleton className="h-full w-full" /> : chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border) / 0.1)" />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={100} 
                                        tick={{ fontSize: 10, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border) / 0.2)', fontSize: '12px' }}
                                        formatter={(val: number) => [formatCurrency(val), 'Montant']}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground italic gap-2">
                                <BarChartIcon className="h-8 w-8 opacity-20" />
                                <span>Aucune donnée analytique sur cette période</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher par description (ex: Loyer, Facture...)"
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
                    <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-primary/10 h-11 luxury-glass overflow-hidden">
                        <Button variant="ghost" size="sm" className="h-8 text-[9px] px-2 font-black uppercase hover:bg-primary/10" onClick={() => setDateShortcut('today')}>Aujourd'hui</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-[9px] px-2 font-black uppercase hover:bg-primary/10" onClick={() => setDateShortcut('yesterday')}>Hier</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-[9px] px-2 font-black uppercase hover:bg-primary/10" onClick={() => setDateShortcut('week')}>7 j</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-[9px] px-2 font-black uppercase hover:bg-primary/10" onClick={() => setDateShortcut('month')}>Mois</Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 min-w-[160px] border-primary/10 luxury-glass rounded-xl justify-between">
                                <span className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold">{selectedCategory === 'all' ? 'Toutes catégories' : selectedCategory}</span>
                                </span>
                                <Filter className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 luxury-glass">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase opacity-50">Filtrer par nature</DropdownMenuLabel>
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
            
            {/* Results Grid */}
            <div className="min-h-[400px]">
               {renderContent()}
            </div>
            
            {/* Dialogs */}
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

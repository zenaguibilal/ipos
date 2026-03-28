
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Calculator, Trash2, Edit, TrendingUp, Target, ShieldAlert, FileText, Info, BarChart3, ArrowRight } from 'lucide-react';
import { RecipeDialog } from '@/components/costing/RecipeDialog';
import { PrintRecipeDialog } from '@/components/costing/PrintRecipeDialog';
import { api } from '@/lib/api-client';
import type { Recipe } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useAppStore, useAppActions, useIsManagerOrAdmin } from '@/stores/appStore';
import { Separator } from '@/components/ui/separator';

const StatCard = ({ title, value, icon: Icon, colorClass, desc }: { title: string, value: string, icon: any, colorClass: string, desc: string }) => (
    <Card className="luxury-glass bg-muted/10 border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
            <Icon className="h-24 w-24 rotate-12" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 opacity-50", colorClass.replace('bg-', 'text-'))} />
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="text-2xl font-black tracking-tight">{value}</div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{desc}</p>
        </CardContent>
    </Card>
);

export default function CostingPage() {
    const router = useRouter();
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const { profile, recipes, isLoading } = useAppStore(state => ({
        profile: state.profile,
        recipes: state.recipes,
        isLoading: state.isLoading.recipes
    }));
    const { refreshRecipes } = useAppActions();

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

    // Role Guard
    useEffect(() => {
        if (profile && !isManagerOrAdmin) {
            toast.error("Accès Souverain Requis", { 
                description: "L'ingénierية des coûts est réservée aux autorités de gestion.",
                icon: <ShieldAlert className="h-4 w-4 text-destructive" />
            });
            router.replace('/sell');
        }
    }, [profile, isManagerOrAdmin, router]);

    useEffect(() => {
        if (isManagerOrAdmin) refreshRecipes();
    }, [refreshRecipes, isManagerOrAdmin]);

    const stats = useMemo(() => {
        if (!recipes || recipes.length === 0) return null;
        const sorted = [...recipes].sort((a, b) => (b.suggestedPrice - b.unitCost) - (a.suggestedPrice - a.unitCost));
        const mostProfitable = sorted[0];
        const avgUnitCost = recipes.reduce((sum, r) => sum + r.unitCost, 0) / recipes.length;
        const criticalMargins = recipes.filter(r => r.targetMargin < 20).length;

        return { mostProfitable, avgUnitCost, criticalMargins };
    }, [recipes]);

    const handleEdit = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsFormDialogOpen(true);
    };

    const handleDeleteClick = (recipe: Recipe) => {
        setRecipeToDelete(recipe);
        setIsDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!recipeToDelete) return;
        try {
            await api.delete(`recipes/${recipeToDelete.uuid}`);
            toast.success("Fiche technique supprimée du nuage.");
            refreshRecipes();
        } catch (error) {
            toast.error("Erreur de suppression souveraine.");
        }
    };

    if (!profile || !isManagerOrAdmin) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
                <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Vérification des Décrets...</h2>
            </div>
        );
    }

    const isInitialLoading = isLoading && recipes.length === 0;

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-700 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader 
                title="Ingénierية des Coûts" 
                description="Maîtrisez vos marges brutes en calculant le prix de revient exact de vos produits transformés."
            >
                <div className="flex gap-2 w-full sm:w-auto">
                    <PrintRecipeDialog recipes={recipes} />
                    <Button onClick={() => { setSelectedRecipe(null); setIsFormDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 rounded-2xl h-12 px-8 font-black uppercase text-[11px] tracking-[0.2em] group gap-3">
                        <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" /> 
                        Nouvelle Fiche
                    </Button>
                </div>
            </PageHeader>

            {!isInitialLoading && recipes.length > 0 && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Point de Coût Moyen" value={formatCurrency(stats.avgUnitCost)} icon={BarChart3} colorClass="bg-blue-500" desc="Moyenne sur l'ensemble du catalogue" />
                    <StatCard title="Architecture d'Élite" value={stats.mostProfitable.name} icon={TrendingUp} colorClass="bg-chart-quaternary" desc="Produit générant la plus forte marge" />
                    <StatCard title="Alerte de Rentabilité" value={`${stats.criticalMargins} Fiche(s)`} icon={Target} colorClass="bg-destructive" desc="Marge inférieure au seuil de 20%" />
                </div>
            )}

            {isInitialLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />)}
                </div>
            ) : recipes.length === 0 ? (
                <EmptyState 
                    icon={Calculator} 
                    title="Aucun Registre de Coût" 
                    description="Commencez par créer une fiche technique pour déterminer le coût réel de vos produits fabriqués."
                    className="py-32 luxury-glass border-white/5 bg-muted/5"
                >
                    <Button onClick={() => setIsFormDialogOpen(true)} className="rounded-2xl px-10 h-14 bg-primary shadow-2xl shadow-primary/20 font-black uppercase text-[11px] tracking-widest">
                        Initialiser ma première fiche
                    </Button>
                </EmptyState>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {recipes.map(recipe => (
                        <Card key={recipe.uuid} className="luxury-glass border-white/5 bg-muted/10 overflow-hidden group hover:border-primary/30 transition-all duration-500 flex flex-col">
                            <CardHeader className="p-6 bg-white/5 border-b border-white/5">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1 overflow-hidden">
                                        <CardTitle className="text-lg font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">{recipe.name}</CardTitle>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <FileText className="h-3 w-3" />
                                            <p className="text-[10px] font-bold uppercase truncate">{recipe.ingredients.length} ingrédients</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black h-6 px-3 rounded-lg shrink-0">
                                        Lot de {recipe.yieldQuantity}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-background/40 rounded-2xl border border-white/5 shadow-inner group-hover:border-destructive/20 transition-all">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Revient U.</p>
                                        <p className="text-xl font-black text-destructive">{formatCurrency(recipe.unitCost)}</p>
                                    </div>
                                    <div className="p-4 bg-chart-quaternary/5 rounded-2xl border border-chart-quaternary/10 shadow-inner group-hover:border-chart-quaternary/30 transition-all">
                                        <p className="text-[9px] font-black uppercase text-chart-quaternary tracking-widest mb-1">Vente Sugg.</p>
                                        <p className="text-xl font-black text-chart-quaternary">{formatCurrency(recipe.suggestedPrice)}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Marge Brute</span>
                                        <Badge variant={recipe.targetMargin < 20 ? 'destructive' : 'secondary'} className="font-black text-[10px] h-5">
                                            {recipe.targetMargin}%
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Bénéfice Net /U</span>
                                        <span className="text-sm font-black text-green-500">+{formatCurrency(recipe.suggestedPrice - recipe.unitCost)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-white/5 border-t border-white/5 p-4 flex justify-between items-center mt-auto">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleEdit(recipe)}>
                                        <Edit className="h-4.5 w-4.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-all" onClick={() => handleDeleteClick(recipe)}>
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase opacity-40">
                                    <TrendingUp className="h-3 w-3" />
                                    MAJ: {new Date(recipe.updatedAt!).toLocaleDateString('fr-FR')}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <RecipeDialog isOpen={isFormDialogOpen} onOpenChange={setIsFormDialogOpen} recipe={selectedRecipe} onSuccess={refreshRecipes} />
            <ConfirmAlertDialog 
                isOpen={isDeleteConfirmOpen} 
                onOpenChange={setIsDeleteConfirmOpen} 
                title="Supprimer la Fiche Technique ?" 
                description={`Cette action est irréversible. Vous perdrez tous les calculs associés à la recette "${recipeToDelete?.name}".`} 
                onConfirm={confirmDelete} 
                confirmText="Supprimer définitivement" 
            />
            
            <div className="p-8 rounded-[3rem] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <Info className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-tight italic">Optimisation Stratégique</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                            Utilisez ces fiches pour ajuster vos tarifs en fonction des fluctuations du prix des matières premières. Une marge saine est le pilier de votre souveraineté commerciale.
                        </p>
                    </div>
                </div>
                <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-3 group" disabled>
                    Guide Méthodologique
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

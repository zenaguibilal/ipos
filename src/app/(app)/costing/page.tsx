'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Calculator, Trash2, Edit, TrendingUp, Target } from 'lucide-react';
import { RecipeDialog } from '@/components/costing/RecipeDialog';
import { api } from '@/lib/api-client';
import type { Recipe } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { useAppStore, useAppActions } from '@/stores/appStore';

/**
 * @fileOverview Cost Engineering Page (State Singularity Enforcement)
 */

const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: any, colorClass: string }) => (
    <Card className="luxury-glass bg-muted/20 border-white/5">
        <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl", colorClass)}>
                <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
                <p className="text-xl font-black">{value}</p>
            </div>
        </CardContent>
    </Card>
);

export default function CostingPage() {
    const { recipes, isLoading } = useAppStore(state => ({
        recipes: state.recipes,
        isLoading: state.isLoading.recipes
    }));
    const { refreshRecipes } = useAppActions();

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);

    useEffect(() => {
        refreshRecipes();
    }, [refreshRecipes]);

    const stats = useMemo(() => {
        if (!recipes || recipes.length === 0) return null;
        const sorted = [...recipes].sort((a, b) => (b.suggestedPrice - b.unitCost) - (a.suggestedPrice - a.unitCost));
        const mostProfitable = sorted[0];
        const avgUnitCost = recipes.reduce((sum, r) => sum + r.unitCost, 0) / recipes.length;
        const lowMarginRecipes = recipes.filter(r => r.targetMargin < 20).length;

        return { mostProfitable, avgUnitCost, lowMarginRecipes };
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
            toast.success("Recette supprimée.");
            refreshRecipes();
        } catch (error) {
            toast.error("Erreur de suppression.");
        }
    };

    const isInitialLoading = isLoading && recipes.length === 0;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader 
                title="Ingénierie des Coûts" 
                description="Maîtrisez vos marges en calculant le prix de revient exact de vos produits transformés."
            >
                <Button onClick={() => { setSelectedRecipe(null); setIsFormDialogOpen(true); }} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Nouvelle Recette
                </Button>
            </PageHeader>

            {!isInitialLoading && recipes.length > 0 && stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard 
                        title="Coût Moyen Unitaire" 
                        value={formatCurrency(stats.avgUnitCost)} 
                        icon={Calculator} 
                        colorClass="bg-blue-500" 
                    />
                    <StatCard 
                        title="Plus rentable" 
                        value={stats.mostProfitable.name} 
                        icon={TrendingUp} 
                        colorClass="bg-chart-quaternary" 
                    />
                    <StatCard 
                        title="Alertes Marges Faibles" 
                        value={`${stats.lowMarginRecipes} Recette(s)`} 
                        icon={Target} 
                        colorClass="bg-destructive" 
                    />
                </div>
            )}

            {isInitialLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                </div>
            ) : recipes.length === 0 ? (
                <EmptyState 
                    icon={Calculator} 
                    title="Aucune fiche technique" 
                    description="Commencez par créer une fiche technique pour calculer le coût réel de vos produits fabriqués."
                >
                    <Button onClick={() => setIsFormDialogOpen(true)}>Créer ma première fiche</Button>
                </EmptyState>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map(recipe => (
                        <Card key={recipe.uuid} className="luxury-glass border-primary/10 overflow-hidden group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl font-bold">{recipe.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{recipe.description || 'Pas de description'}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        Lot de {recipe.yieldQuantity}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/30 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Coût Unitaire</p>
                                        <p className="text-xl font-black text-destructive">{formatCurrency(recipe.unitCost)}</p>
                                    </div>
                                    <div className="p-3 bg-chart-quaternary/5 rounded-xl border border-chart-quaternary/10">
                                        <p className="text-[10px] font-black uppercase text-chart-quaternary tracking-widest">Prix Suggéré</p>
                                        <p className="text-xl font-black text-chart-quaternary">{formatCurrency(recipe.suggestedPrice)}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Marge cible :</span>
                                        <span className="font-bold">{recipe.targetMargin}%</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Bénéfice net /unité :</span>
                                        <span className="font-black text-green-500">+{formatCurrency(recipe.suggestedPrice - recipe.unitCost)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/20 border-t border-white/5 p-3 flex justify-between">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => handleEdit(recipe)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => handleDeleteClick(recipe)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground italic">
                                    <TrendingUp className="h-3 w-3" />
                                    MAJ : {new Date(recipe.updatedAt!).toLocaleDateString('fr-FR')}
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <RecipeDialog 
                isOpen={isFormDialogOpen} 
                onOpenChange={setIsFormDialogOpen} 
                recipe={selectedRecipe}
                onSuccess={refreshRecipes}
            />

            <ConfirmAlertDialog 
                isOpen={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title="Supprimer la fiche technique ?"
                description={`Voulez-vous vraiment supprimer la recette "${recipeToDelete?.name}" ? Cette action est irréversible.`}
                onConfirm={confirmDelete}
                confirmText="Supprimer"
            />
        </div>
    );
}

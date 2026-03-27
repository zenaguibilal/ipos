
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Calculator, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { recipeService } from '@/services/recipe.service';
import { productService } from '@/services/product.service';
import type { Recipe, RecipeIngredient, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Combobox } from '../ui/combobox';

interface RecipeDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    recipe: Recipe | null;
    onSuccess: () => void;
}

export function RecipeDialog({ isOpen, onOpenChange, recipe, onSuccess }: RecipeDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [yieldQty, setYieldQty] = useState(1);
    const [targetMargin, setTargetMargin] = useState(30);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        if (isOpen) {
            productService.getProducts().then(setProducts).catch(() => setProducts([]));
            if (recipe) {
                setName(recipe.name);
                setDescription(recipe.description || '');
                setYieldQty(recipe.yieldQuantity);
                setTargetMargin(recipe.targetMargin);
                setIngredients(recipe.ingredients);
            } else {
                setName('');
                setDescription('');
                setYieldQty(1);
                setTargetMargin(30);
                setIngredients([]);
            }
        }
    }, [isOpen, recipe]);

    const totalCost = useMemo(() => ingredients.reduce((sum, i) => sum + (i.cost * i.quantity), 0), [ingredients]);
    const unitCost = yieldQty > 0 ? totalCost / yieldQty : 0;
    const suggestedPrice = unitCost / (1 - (targetMargin / 100));

    const handleAddIngredient = (productUuid: string) => {
        const product = products.find(p => p.uuid === productUuid);
        if (!product) return;
        
        if (ingredients.some(i => i.productUuid === productUuid)) {
            toast.info("Cet ingrédient est déjà dans la liste.");
            return;
        }

        setIngredients([...ingredients, {
            productUuid: product.uuid,
            name: product.name,
            quantity: 1,
            unit: product.unite,
            cost: product.purchasePrice
        }]);
    };

    const handleUpdateIngredient = (index: number, qty: number) => {
        const updated = [...ingredients];
        updated[index].quantity = qty;
        setIngredients(updated);
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Le nom de la recette est requis.");
        if (ingredients.length === 0) return toast.error("Ajoutez au moins un ingrédient.");

        setIsSaving(true);
        try {
            await recipeService.saveRecipe({
                uuid: recipe?.uuid,
                name,
                description,
                ingredients,
                yieldQuantity: yieldQty,
                totalCost,
                unitCost,
                targetMargin,
                suggestedPrice
            });
            toast.success("Recette enregistrée.");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    const productOptions = products.map(p => ({
        label: p.name,
        value: p.uuid,
        subLabel: `${formatCurrency(p.purchasePrice)} / ${p.unite}`
    }));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col luxury-glass">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        {recipe ? 'Modifier la Fiche Technique' : 'Nouvelle Fiche Technique'}
                    </DialogTitle>
                    <DialogDescription>
                        Calculez précisément votre prix de revient et votre marge bénéficiaire.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden py-4">
                    <div className="space-y-4 flex flex-col overflow-hidden">
                        <div className="space-y-2">
                            <Label>Nom du produit fini</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pain de campagne, Gâteau chocolat..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Description / Notes</Label>
                            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Notes de préparation..." />
                        </div>
                        
                        <div className="flex-grow flex flex-col overflow-hidden border rounded-xl bg-muted/10">
                            <div className="p-3 border-b bg-muted/20">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sélection des Ingrédients (Matières Premières)</Label>
                                <div className="mt-2">
                                    <Combobox 
                                        options={productOptions} 
                                        onSelect={handleAddIngredient}
                                        value=""
                                        placeholder="Rechercher un produit..."
                                        searchPlaceholder="Nom ou code..."
                                        notFoundMessage="Aucun produit trouvé."
                                    />
                                </div>
                            </div>
                            <ScrollArea className="flex-grow">
                                <div className="p-2 space-y-2">
                                    {ingredients.map((ing, idx) => (
                                        <div key={ing.productUuid} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-white/5">
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-bold truncate">{ing.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{formatCurrency(ing.cost)} / {ing.unit}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Input 
                                                    type="number" 
                                                    value={ing.quantity} 
                                                    onChange={e => handleUpdateIngredient(idx, parseFloat(e.target.value) || 0)}
                                                    className="h-8 w-16 text-center"
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveIngredient(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {ingredients.length === 0 && (
                                        <p className="text-center py-12 text-xs text-muted-foreground italic">Aucun ingrédient ajouté.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Rendement (Yield)</Label>
                                    <Input type="number" value={yieldQty} onChange={e => setYieldQty(parseFloat(e.target.value) || 1)} className="h-12 text-lg font-bold" />
                                    <p className="text-[10px] text-muted-foreground">Quantité d'unités produites</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase">Marge Cible (%)</Label>
                                    <Input type="number" value={targetMargin} onChange={e => setTargetMargin(parseFloat(e.target.value) || 0)} className="h-12 text-lg font-bold" />
                                    <p className="text-[10px] text-muted-foreground">Bénéfice souhaité</p>
                                </div>
                            </div>

                            <Separator className="bg-primary/10" />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-muted-foreground">Coût Total Matières :</span>
                                    <span className="text-lg font-bold">{formatCurrency(totalCost)}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                                    <span className="text-sm font-black text-destructive uppercase">Coût de Revient Unitaire :</span>
                                    <span className="text-2xl font-black text-destructive">{formatCurrency(unitCost)}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-2xl bg-chart-quaternary/10 border border-chart-quaternary/20">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-chart-quaternary uppercase">Prix de Vente Suggéré :</span>
                                        <span className="text-[10px] text-chart-quaternary font-bold opacity-70">Incluant {targetMargin}% de marge</span>
                                    </div>
                                    <span className="text-3xl font-black text-chart-quaternary">{formatCurrency(suggestedPrice)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-white/5 pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Annuler</Button>
                    <Button onClick={handleSave} disabled={isSaving || ingredients.length === 0} className="bg-primary hover:bg-primary/90 px-10 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Enregistrer la Fiche
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={cn("h-px w-full", className)} />;
}

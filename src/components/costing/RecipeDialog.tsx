
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Calculator, Loader2 } from 'lucide-react';
import type { Recipe, Ingredient } from '@/lib/types';
import { recipeService } from '@/services/recipe.service';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '@/lib/utils';

interface RecipeDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    recipe: Recipe | null;
    onSuccess: () => void;
}

export function RecipeDialog({ isOpen, onOpenChange, recipe, onSuccess }: RecipeDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [yieldQuantity, setYieldQuantity] = useState(1);
    const [targetMargin, setTargetMargin] = useState(30);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (recipe && isOpen) {
            setName(recipe.name);
            setDescription(recipe.description || '');
            setYieldQuantity(recipe.yieldQuantity);
            setTargetMargin(recipe.targetMargin);
            setIngredients(recipe.ingredients);
        } else if (isOpen) {
            setName('');
            setDescription('');
            setYieldQuantity(1);
            setTargetMargin(30);
            setIngredients([{ id: uuidv4(), name: '', quantity: 1, unit: 'g', unitCost: 0 }]);
        }
    }, [recipe, isOpen]);

    const totalCost = useMemo(() => {
        return ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.unitCost), 0);
    }, [ingredients]);

    const unitCost = useMemo(() => {
        return yieldQuantity > 0 ? totalCost / yieldQuantity : 0;
    }, [totalCost, yieldQuantity]);

    const suggestedPrice = useMemo(() => {
        if (targetMargin >= 100) return unitCost * 2;
        return unitCost / (1 - targetMargin / 100);
    }, [unitCost, targetMargin]);

    const addIngredient = () => {
        setIngredients([...ingredients, { id: uuidv4(), name: '', quantity: 1, unit: 'g', unitCost: 0 }]);
    };

    const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
        setIngredients(ingredients.map(ing => 
            ing.id === id ? { ...ing, [field]: value } : ing
        ));
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Le nom de la recette est requis.");
            return;
        }
        if (ingredients.length === 0) {
            toast.error("Ajoutez au moins un ingrédient.");
            return;
        }

        setIsSaving(true);
        try {
            const data = {
                name,
                description,
                yieldQuantity,
                targetMargin,
                ingredients,
                unitCost,
                suggestedPrice
            };

            if (recipe) {
                await recipeService.updateRecipe(recipe.uuid, data);
                toast.success("Recette mise à jour.");
            } else {
                await recipeService.addRecipe(data);
                toast.success("Nouvelle recette créée.");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Erreur: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col luxury-glass border-primary/20">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-primary" />
                        {recipe ? 'Modifier la Fiche Technique' : 'Nouvelle Fiche Technique'}
                    </DialogTitle>
                    <DialogDescription>
                        Calculez précisément votre prix de revient et votre marge bénéficiaire.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="recipe-name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom du Produit Fini</Label>
                                <Input id="recipe-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pain Traditionnel, Gâteau Chocolat..." className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recipe-desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description (Optionnel)</Label>
                                <Textarea id="recipe-desc" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl min-h-[80px]" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 h-fit">
                            <div className="space-y-2">
                                <Label htmlFor="yield" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rendement (Quantité)</Label>
                                <Input id="yield" type="number" value={yieldQuantity} onChange={e => setYieldQuantity(Number(e.target.value))} className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="margin" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Marge Cible (%)</Label>
                                <Input id="margin" type="number" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} className="h-11 rounded-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col min-h-0 border rounded-2xl bg-muted/10 overflow-hidden">
                        <div className="p-4 border-b bg-white/5 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Ingrédients & Matières Premières</h3>
                            <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="rounded-lg h-8 border-primary/30 text-primary">
                                <Plus className="h-3 w-3 mr-1" /> Ajouter
                            </Button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black uppercase">Ingrédient</TableHead>
                                        <TableHead className="text-center text-[10px] font-black uppercase">Quantité</TableHead>
                                        <TableHead className="text-center text-[10px] font-black uppercase">Unité</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase">Coût Unitaire</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase">Total</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ingredients.map((ing) => (
                                        <TableRow key={ing.id} className="hover:bg-primary/5 transition-colors">
                                            <TableCell>
                                                <Input value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} className="h-8 text-xs rounded-lg" placeholder="Nom..." />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input type="number" value={ing.quantity} onChange={e => updateIngredient(ing.id, 'quantity', Number(e.target.value))} className="h-8 w-20 text-center mx-auto text-xs rounded-lg" />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input value={ing.unit} onChange={e => updateIngredient(ing.id, 'unit', e.target.value)} className="h-8 w-16 text-center mx-auto text-xs rounded-lg" placeholder="g, kg..." />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input type="number" step="0.01" value={ing.unitCost} onChange={e => updateIngredient(ing.id, 'unitCost', Number(e.target.value))} className="h-8 w-24 text-right ml-auto text-xs rounded-lg" />
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-xs">
                                                {formatCurrency(ing.quantity * ing.unitCost)}
                                            </TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(ing.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
                        <div className="p-4 bg-muted/30 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Coût Total Matières</p>
                            <p className="text-xl font-black">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                            <p className="text-[9px] font-black uppercase text-primary tracking-tighter mb-1">Prix de Revient / Unité</p>
                            <p className="text-xl font-black text-primary">{formatCurrency(unitCost)}</p>
                        </div>
                        <div className="p-4 bg-chart-quaternary/10 rounded-2xl border border-chart-quaternary/20 text-center">
                            <p className="text-[9px] font-black uppercase text-chart-quaternary tracking-tighter mb-1">Prix de Vente Suggéré</p>
                            <p className="text-xl font-black text-chart-quaternary">{formatCurrency(suggestedPrice)}</p>
                        </div>
                    </div>
                </form>

                <DialogFooter className="border-t pt-4 bg-white/5 p-6 rounded-b-3xl">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-8 uppercase font-black text-[10px] tracking-widest">Annuler</Button>
                    <Button onClick={handleSubmit} disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-10 shadow-lg shadow-primary/20 uppercase font-black text-[10px] tracking-widest gap-2">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Enregistrer la Fiche
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

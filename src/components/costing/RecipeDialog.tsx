
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
import { Plus, Trash2, Calculator, Loader2, Sparkles, Scale, Percent } from 'lucide-react';
import type { Recipe, Ingredient } from '@/lib/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency, cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

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
        return ingredients.reduce((sum, ing) => sum + (Number(ing.quantity) * Number(ing.unitCost)), 0);
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
                yieldQuantity: Number(yieldQuantity),
                targetMargin: Number(targetMargin),
                ingredients: ingredients.map(i => ({
                    ...i,
                    quantity: Number(i.quantity),
                    unitCost: Number(i.unitCost)
                })),
                unitCost,
                suggestedPrice
            };

            if (recipe) {
                await api.put(`recipes/${recipe.uuid}`, data);
                toast.success("Fiche technique mise à jour.");
            } else {
                await api.post('recipes', data);
                toast.success("Nouvelle fiche technique créée.");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col luxury-glass border-primary/20 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                            <Calculator className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">Ingénierie <span className="text-primary">des Coûts</span></DialogTitle>
                            <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-2 flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                Calculateur de prix de revient et marges brutes
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="recipe-name" className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Désignation du Produit Fini</Label>
                                <Input id="recipe-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Baguette Tradition, Tartelette Citron..." className="h-14 rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-lg shadow-inner" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recipe-desc" className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Notes de Fabrication (Optionnel)</Label>
                                <Textarea id="recipe-desc" value={description} onChange={e => setDescription(e.target.value)} className="rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 min-h-[100px] shadow-inner" placeholder="Instructions de dosage ou commentaires techniques..." />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 h-fit p-6 rounded-[2rem] bg-muted/10 border border-white/5 shadow-inner">
                            <div className="space-y-3">
                                <Label htmlFor="yield" className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                    <Scale className="h-3 w-3" /> Rendement Lot
                                </Label>
                                <Input id="yield" type="number" value={yieldQuantity} onChange={e => setYieldQuantity(Number(e.target.value))} className="h-14 rounded-xl bg-background border-white/5 text-center font-black text-2xl" required />
                                <p className="text-[8px] text-muted-foreground text-center uppercase font-bold opacity-50">Unités par lot</p>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="margin" className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                    <Percent className="h-3 w-3" /> Marge Cible
                                </Label>
                                <Input id="margin" type="number" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))} className="h-14 rounded-xl bg-background border-white/5 text-center font-black text-2xl text-chart-quaternary" required />
                                <p className="text-[8px] text-muted-foreground text-center uppercase font-bold opacity-50">Pourcentage (%)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col min-h-0 border-2 border-white/5 rounded-[2.5rem] bg-muted/5 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Nomenclature des Ingrédients</Label>
                                <Badge variant="outline" className="h-5 text-[9px] font-black bg-primary/5 border-primary/20 text-primary">{ingredients.length} Composants</Badge>
                            </div>
                            <Button type="button" variant="outline" className="rounded-xl h-10 px-6 border-primary/30 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest" onClick={addIngredient}>
                                <Plus className="h-4 w-4 mr-2" /> Ajouter Ingrédient
                            </Button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-xl z-10 border-b border-white/5">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-8">Matière Première</TableHead>
                                        <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Quantité</TableHead>
                                        <TableHead className="text-center text-[10px] font-black uppercase tracking-widest">Unité</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Coût U. (DA)</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">Sous-Total</TableHead>
                                        <TableHead className="w-12 pr-8"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ingredients.map((ing) => (
                                        <TableRow key={ing.id} className="hover:bg-white/5 transition-colors border-white/5">
                                            <TableCell className="py-4 pl-8">
                                                <Input value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} className="h-10 text-sm rounded-lg bg-background/40 border-white/5 font-bold" placeholder="Nom du composant..." required />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input type="number" value={ing.quantity} onChange={e => updateIngredient(ing.id, 'quantity', e.target.value)} className="h-10 w-24 text-center mx-auto text-sm rounded-lg bg-background/40 border-white/5 font-mono font-bold" required />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input value={ing.unit} onChange={e => updateIngredient(ing.id, 'unit', e.target.value)} className="h-10 w-20 text-center mx-auto text-[10px] uppercase font-black rounded-lg bg-muted/50 border-white/5" placeholder="G, KG..." required />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Input type="number" step="0.01" value={ing.unitCost} onChange={e => updateIngredient(ing.id, 'unitCost', e.target.value)} className="h-10 w-28 text-right ml-auto text-sm rounded-lg bg-background/40 border-white/5 font-mono font-bold text-destructive" required />
                                            </TableCell>
                                            <TableCell className="text-right pr-8 font-black text-sm">
                                                {formatCurrency(Number(ing.quantity) * Number(ing.unitCost))}
                                            </TableCell>
                                            <TableCell className="pr-8">
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(ing.id)} className="h-9 w-9 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
                        <div className="p-6 bg-muted/20 rounded-[2rem] border border-white/5 text-center group hover:bg-muted/30 transition-all shadow-inner">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-2">Matières Premières Totales</p>
                            <p className="text-3xl font-black">{formatCurrency(totalCost)}</p>
                        </div>
                        <div className="p-6 bg-primary/10 rounded-[2rem] border border-primary/20 text-center relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
                            <p className="text-[10px] font-black uppercase text-primary tracking-tighter mb-2 relative z-10">Prix de Revient Unitaire</p>
                            <p className="text-4xl font-black text-primary relative z-10">{formatCurrency(unitCost)}</p>
                        </div>
                        <div className="p-6 bg-chart-quaternary/10 rounded-[2rem] border border-chart-quaternary/20 text-center group hover:bg-chart-quaternary/20 transition-all shadow-2xl">
                            <p className="text-[10px] font-black uppercase text-chart-quaternary tracking-tighter mb-2">Prix de Vente Suggéré</p>
                            <p className="text-4xl font-black text-chart-quaternary">{formatCurrency(suggestedPrice)}</p>
                        </div>
                    </div>
                </form>

                <DialogFooter className="border-t border-white/5 bg-white/5 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 max-w-md">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Scale className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                            "Ce calcul est déterministe. Il ne prend pas en compte les charges fixes (loyer, électricité) à moins de les ajouter en tant qu'ingrédients de service."
                        </p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-14 px-10 uppercase font-black text-[11px] tracking-widest">Annuler</Button>
                        <Button onClick={handleSubmit} disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-2xl h-14 px-12 shadow-2xl shadow-primary/30 uppercase font-black text-[11px] tracking-[0.3em] gap-3 hover:scale-105 active:scale-95 transition-all">
                            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            Graver la Fiche Technique
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

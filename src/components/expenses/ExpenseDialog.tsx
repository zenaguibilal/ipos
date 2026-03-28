
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { Loader2, Banknote, Tag, Calendar, Sparkles, ShieldCheck, X } from 'lucide-react';
import { api } from '@/lib/api-client';
import { DatePicker } from '../ui/date-picker';
import { Combobox } from '../ui/combobox';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

const defaultCategories: string[] = ['Loyer', 'Salaires', 'Fournisseurs', 'Services Publics', 'Marketing', 'Maintenance', 'Autre'];

interface ExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
    onSuccess: () => void;
    existingCategories: string[];
}

const initialFormState = {
    description: '',
    category: 'Autre',
    amount: '',
    expenseDate: new Date().toISOString(),
};

export default function ExpenseDialog({ isOpen, onOpenChange, expense, onSuccess, existingCategories }: ExpenseDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (expense && isOpen) {
            setFormState({
                description: expense.description,
                category: expense.category,
                amount: String(expense.amount),
                expenseDate: expense.expenseDate,
            });
        } else if (!expense && isOpen) {
            setFormState({ ...initialFormState, expenseDate: new Date().toISOString() });
        }
    }, [expense, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };
    
    const handleCategoryChange = (value: string) => {
        setFormState(prev => ({ ...prev, category: value }));
    };

    const handleDateChange = (date?: Date) => {
        if (date) {
            setFormState(prev => ({ ...prev, expenseDate: date.toISOString() }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const amountNum = parseFloat(formState.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error("Veuillez entrer un montant valide.");
            return;
        }

        setIsLoading(true);
        try {
            const expenseData = { 
                description: formState.description,
                category: formState.category,
                amount: amountNum,
                expenseDate: formState.expenseDate
            };
            if (expense && expense.uuid) {
                await api.put(`expenses/${expense.uuid}`, expenseData);
                toast.success(`Dépense rectifiée dans le nuage.`);
            } else {
                await api.post('expenses', expenseData);
                toast.success(`Nouvelle charge enregistrée.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            toast.error("Échec de l'enregistrement souverain.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const categoryOptions = Array.from(new Set([...defaultCategories, ...existingCategories]))
        .map(c => ({ value: c, label: c }));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl luxury-glass border-destructive/20 p-0 overflow-hidden shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-8 bg-destructive/[0.03] border-b border-white/5 relative">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-destructive/10 rounded-2xl shadow-inner">
                                <Banknote className="h-8 w-8 text-destructive" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Registre des <span className="text-destructive">Charges</span></DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-2 flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-destructive animate-pulse" />
                                    Initialisation d'un flux de sortie de caisse
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Libellé de la Dépense</Label>
                                <div className="relative group">
                                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive/30 group-focus-within:text-destructive transition-colors" />
                                    <Input 
                                        id="description" 
                                        value={formState.description} 
                                        onChange={handleInputChange} 
                                        required 
                                        autoFocus 
                                        className="pl-12 h-14 rounded-2xl bg-background/40 border-white/10 focus:border-destructive/40 focus:ring-0 font-bold text-lg shadow-inner" 
                                        placeholder="Ex: Paiement Loyer Mars, Facture Électricité..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Montant Net (DA)</Label>
                                    <div className="relative group">
                                        <Input 
                                            id="amount" 
                                            type="number" 
                                            step="0.1" 
                                            value={formState.amount} 
                                            onChange={handleInputChange} 
                                            required 
                                            className="h-14 pl-4 text-2xl font-black text-destructive rounded-2xl bg-background/40 border-white/10 focus:border-destructive/40 shadow-inner" 
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-destructive/40 uppercase tracking-widest">Dinar Algérien</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Horodatage du Flux</Label>
                                    <div className="h-14 flex items-center px-4 rounded-2xl bg-background/40 border border-white/10 shadow-inner group-focus-within:border-primary/40">
                                        <Calendar className="h-5 w-5 text-muted-foreground/30 mr-2" />
                                        <DatePicker date={new Date(formState.expenseDate)} setDate={handleDateChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-[11px] font-black uppercase tracking-widest opacity-70 ml-1">Affectation Budgétaire (Catégorie)</Label>
                                <div className="relative">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-grow">
                                            <Combobox 
                                                options={categoryOptions}
                                                value={formState.category}
                                                onSelect={handleCategoryChange}
                                                placeholder="Sélectionner un poste de dépense..."
                                                searchPlaceholder="Rechercher..."
                                                notFoundMessage="Poste inconnu."
                                            />
                                        </div>
                                        <div className="p-3 bg-muted/20 rounded-xl border border-white/5">
                                            <Tag className="h-5 w-5 text-muted-foreground/40" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="p-5 rounded-[1.5rem] border-2 border-dashed border-destructive/20 bg-destructive/5 flex items-start gap-4 shadow-inner">
                            <ShieldCheck className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                "L'enregistrement d'une charge est une opération déterministe. Elle sera immédiatement déduite de votre bénéfice net calculé dans le dashboard iPOS."
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-white/5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-14 px-10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5">
                            Annuler
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading} 
                            className="bg-destructive hover:bg-destructive/90 rounded-2xl h-14 px-12 shadow-2xl shadow-destructive/30 font-black uppercase text-[11px] tracking-[0.2em] gap-3 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                        >
                             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                            Graver la Charge
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { expenseService } from '@/services/expense.service';
import { DatePicker } from '../ui/date-picker';
import { Combobox } from '../ui/combobox';

const defaultCategories: ExpenseCategory[] = ['Loyer', 'Salaires', 'Fournisseurs', 'Services Publics', 'Marketing', 'Maintenance', 'Autre'];

interface ExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
    onSuccess: () => void;
    existingCategories: string[];
}

const initialFormState: Omit<Expense, 'uuid' | 'user_id' | 'createdAt' | 'updatedAt'> = {
    description: '',
    category: 'Autre',
    amount: 0,
    expenseDate: new Date(),
};

export default function ExpenseDialog({ isOpen, onOpenChange, expense, onSuccess, existingCategories }: ExpenseDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

     useEffect(() => {
        if (expense && isOpen) {
            setFormState({
                description: expense.description,
                category: expense.category,
                amount: expense.amount,
                expenseDate: new Date(expense.expenseDate),
            });
        } else if (!expense && isOpen) {
            setFormState({ ...initialFormState, expenseDate: new Date() });
        }
    }, [expense, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };
    
    const handleCategoryChange = (value: string) => {
        setFormState(prev => ({ ...prev, category: value as ExpenseCategory }));
    };

    const handleDateChange = (date?: Date) => {
        if (date) {
            setFormState(prev => ({ ...prev, expenseDate: date }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { description, amount, category, expenseDate } = formState;

        if (!description || !amount) {
            setError("La description et le montant sont requis.");
            setIsLoading(false);
            return;
        }

        const amountNum = parseFloat(String(amount));
        if (isNaN(amountNum) || amountNum <= 0) {
            setError("Veuillez entrer un montant valide.");
            setIsLoading(false);
            return;
        }
        
        const expenseData = { ...formState, amount: amountNum };

        try {
            if (expense && expense.uuid) { // Editing
                await expenseService.updateExpense(expense.uuid, expenseData);
                toast.success(`Dépense modifiée.`);
            } else { // Adding
                await expenseService.addExpense(expenseData);
                toast.success(`Dépense ajoutée.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
            toast.error("Échec de l'opération.", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const categoryOptions = Array.from(new Set([...defaultCategories, ...existingCategories])).map(c => ({ value: c, label: c }));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md luxury-glass">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-bold">{expense ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
                        <DialogDescription>
                           Remplissez les détails de la charge pour votre comptabilité.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center font-bold">{error}</p>}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Description</Label>
                            <Input id="description" value={formState.description} onChange={handleInputChange} required autoFocus className="h-11 rounded-xl" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Montant (DA)</Label>
                            <Input id="amount" type="number" step="0.1" value={formState.amount} onChange={handleInputChange} required className="h-11 text-lg font-black text-destructive rounded-xl" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Catégorie</Label>
                                <Combobox 
                                    options={categoryOptions}
                                    value={formState.category}
                                    onSelect={handleCategoryChange}
                                    placeholder="Sélectionner..."
                                    searchPlaceholder="Rechercher..."
                                    notFoundMessage="Aucune catégorie trouvée."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold uppercase text-[10px] tracking-widest opacity-70">Date</Label>
                                <DatePicker date={formState.expenseDate} setDate={handleDateChange} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/50">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="bg-destructive hover:bg-destructive/90 rounded-xl px-8 h-11">
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { dataService } from '@/services/data-service';
import { format } from 'date-fns';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const expenseCategories: ExpenseCategory[] = ['Loyer', 'Salaires', 'Fournisseurs', 'Services Publics', 'Marketing', 'Maintenance', 'Autre'];

interface ExpenseDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    expense: Expense | null;
}

const initialFormState: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
    description: '',
    category: 'Autre',
    amount: 0,
    expenseDate: new Date(),
};

export default function ExpenseDialog({ isOpen, onOpenChange, expense }: ExpenseDialogProps) {
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
    
    const handleCategoryChange = (value: ExpenseCategory) => {
        setFormState(prev => ({ ...prev, category: value }));
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
            if (expense && expense.id) { // Editing
                await dataService.updateExpense(expense.id, expenseData);
                toast.success(`Dépense modifiée.`);
            } else { // Adding
                await dataService.addExpense(expenseData);
                toast.success(`Dépense ajoutée.`);
            }
            onOpenChange(false);
        } catch (err) {
            setError("Une erreur est survenue.");
            toast.error("Échec de l'opération.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{expense ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
                        <DialogDescription>
                           Remplissez les détails de la charge.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={formState.description} onChange={handleInputChange} required autoFocus />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="amount">Montant (DA)</Label>
                            <Input id="amount" type="number" step="0.1" value={formState.amount} onChange={handleInputChange} required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Select value={formState.category} onValueChange={handleCategoryChange}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <DatePicker date={formState.expenseDate} setDate={handleDateChange} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

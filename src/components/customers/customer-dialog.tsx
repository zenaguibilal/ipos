
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Customer } from '@/lib/types';
import { Loader2, ChevronsUpDown, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface CustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    customer: Customer | null;
    onSuccess: (customer?: Customer) => void;
}

const initialFormState = { firstName: '', lastName: '', phone: '', address: '', notes: '', category: 'Standard', settlementDay: '', creditLimit: '' };

export function CustomerDialog({ isOpen, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [categorySearch, setCategorySearch] = useState('');
    const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);

    useEffect(() => {
        if (isOpen) api.get<string[]>('customers/categories').then(setCategories);
    }, [isOpen]);

     useEffect(() => {
        if (customer && isOpen) {
            setFormState({ firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone || '', address: customer.address || '', notes: customer.notes || '', category: customer.category || 'Standard', settlementDay: String(customer.settlementDay || ''), creditLimit: String(customer.creditLimit || '') });
        } else { setFormState(initialFormState); }
    }, [customer, isOpen]);

    const categoryOptions = useMemo(() => {
        const base = Array.from(new Set(['Standard', 'VIP', 'Wholesale', ...categories]));
        return categorySearch ? base.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())) : base;
    }, [categories, categorySearch]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = { ...formState, settlementDay: formState.settlementDay ? parseInt(formState.settlementDay) : undefined, creditLimit: formState.creditLimit ? parseFloat(formState.creditLimit) : undefined };
            const result = customer ? await api.put<Customer>(`customers/${customer.uuid}`, data) : await api.post<Customer>('customers', data);
            toast.success(`Succès.`);
            onSuccess(result);
            onOpenChange(false);
        } catch (err: any) {
            toast.error("Échec.");
        } finally { setIsLoading(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader><DialogTitle>{customer ? 'Modifier' : 'Nouveau'} client</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Prénom</Label><Input value={formState.firstName} onChange={e => setFormState(s => ({...s, firstName: e.target.value}))} required /></div>
                            <div className="space-y-2"><Label>Nom</Label><Input value={formState.lastName} onChange={e => setFormState(s => ({...s, lastName: e.target.value}))} required /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Catégorie</Label>
                            <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between font-normal">{formState.category}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command><CommandInput onValueChange={setCategorySearch} /><CommandList><CommandEmpty><Button variant="link" onClick={() => { setFormState(s => ({ ...s, category: categorySearch })); setCategoryPopoverOpen(false); }}>Créer "{categorySearch}"</Button></CommandEmpty><CommandGroup>{categoryOptions.map(cat => <CommandItem key={cat} onSelect={() => { setFormState(s => ({ ...s, category: cat })); setCategoryPopoverOpen(false); }}>{cat}</CommandItem>)}</CommandGroup></CommandList></Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2"><Label>Téléphone</Label><Input value={formState.phone} onChange={e => setFormState(s => ({...s, phone: e.target.value}))} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Délai (jours)</Label><Input type="number" value={formState.settlementDay} onChange={e => setFormState(s => ({...s, settlementDay: e.target.value}))} /></div>
                            <div className="space-y-2"><Label>Crédit Max</Label><Input type="number" value={formState.creditLimit} onChange={e => setFormState(s => ({...s, creditLimit: e.target.value}))} /></div>
                        </div>
                        <div className="space-y-2"><Label>Notes</Label><Textarea value={formState.notes} onChange={e => setFormState(s => ({...s, notes: e.target.value}))} /></div>
                    </div>
                    <DialogFooter><Button type="submit" disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

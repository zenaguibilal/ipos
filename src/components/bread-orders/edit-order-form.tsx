
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { BreadOrder, Customer } from '@/lib/types';
import { Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';

interface EditOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (id: string, name: string, quantity: number, isRecurring: boolean, customerId: string | null) => Promise<void>;
    order: BreadOrder;
    customers: Customer[];
    isLoadingCustomers: boolean;
}

export function EditOrderForm({ isOpen, onOpenChange, onConfirm, order, customers, isLoadingCustomers }: EditOrderFormProps) {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);

     useEffect(() => {
        if (order) {
            setName(order.name);
            setQuantity(String(order.quantity));
            setIsRecurring(order.isRecurring);
            setCustomerId(order.customerId || null);
        }
    }, [order]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const quantityNumber = parseInt(quantity, 10);

        if (!name.trim()) {
            toast.error("Veuillez entrer un nom.");
            return;
        }

        if (isNaN(quantityNumber) || quantityNumber <= 0) {
            toast.error("Veuillez entrer une quantité valide.");
            return;
        }

        setIsLoading(true);
        try {
            await onConfirm(order.id, name, quantityNumber, isRecurring, customerId);
            onOpenChange(false);
        } catch (error) {
            // Parent page shows toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Modifier la commande</DialogTitle>
                        <DialogDescription>
                           Mettez à jour les informations de la commande.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="order-name" className="text-right">Nom</Label>
                            <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                <PopoverTrigger asChild className="col-span-3">
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isComboboxOpen}
                                        className="w-full justify-between font-normal"
                                        disabled={isLoadingCustomers || isLoading}
                                    >
                                        <span className="truncate">{name || "Sélectionnez ou entrez un nom..."}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput 
                                            placeholder="Rechercher ou créer un nom..."
                                            value={name}
                                            onValueChange={(searchValue) => {
                                                setName(searchValue);
                                                const exactMatch = customers.find(c => `${c.firstName} ${c.lastName}` === searchValue);
                                                if (!exactMatch) {
                                                    setCustomerId(null);
                                                }
                                            }}
                                        />
                                        <CommandList>
                                            <CommandEmpty>Aucun client trouvé. Le nom sera créé.</CommandEmpty>
                                            <CommandGroup>
                                                {customers.map((customer) => {
                                                    const fullName = `${customer.firstName} ${customer.lastName}`;
                                                    return (
                                                        <CommandItem
                                                            key={customer.id}
                                                            value={fullName}
                                                            onSelect={() => {
                                                                setName(fullName);
                                                                setCustomerId(customer.id);
                                                                setIsComboboxOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", customerId === customer.id ? "opacity-100" : "opacity-0")} />
                                                            {fullName}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-order-quantity" className="text-right">Quantité</Label>
                            <Input id="edit-order-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="col-span-3" required disabled={isLoading} />
                        </div>
                        <div className="flex items-center space-x-2 justify-center pt-2">
                            <Label htmlFor="edit-is-recurring">Commande récurrente ?</Label>
                            <Switch
                                id="edit-is-recurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                                disabled={isLoading}
                            />
                            <p className='text-xs text-muted-foreground'>(Conserver pour demain)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Annuler
                        </Button>
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

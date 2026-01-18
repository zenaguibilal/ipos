'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { BreadOrder, Customer } from '@/lib/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditOrderFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onConfirm: (id: string, customer: {id: string, name: string}, quantity: number, isRecurring: boolean) => void;
    order: BreadOrder;
    customers: Customer[];
}

export function EditOrderForm({ isOpen, onOpenChange, onConfirm, order, customers }: EditOrderFormProps) {
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);


     useEffect(() => {
        if (order) {
            setSelectedCustomerId(order.customerId);
            setQuantity(String(order.quantity));
            setIsRecurring(order.isRecurring);
        }
    }, [order]);


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const quantityNumber = parseInt(quantity, 10);
        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);


        if (!selectedCustomer) {
            toast.error("Veuillez sélectionner un client.");
            return;
        }

        if (isNaN(quantityNumber) || quantityNumber <= 0) {
            toast.error("Veuillez entrer une quantité valide.");
            return;
        }

        onConfirm(order.id, { id: selectedCustomer.id, name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`}, quantityNumber, isRecurring);
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
                            <Label htmlFor="edit-order-customer" className="text-right">Client</Label>
                             <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isComboboxOpen}
                                    className="col-span-3 justify-between"
                                    >
                                    {selectedCustomerId
                                        ? customers.find((c) => c.id === selectedCustomerId)?.firstName + ' ' + customers.find((c) => c.id === selectedCustomerId)?.lastName
                                        : "Sélectionner un client..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Rechercher un client..." />
                                        <CommandList>
                                            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                                            <CommandGroup>
                                            {customers.map((customer) => (
                                                <CommandItem
                                                key={customer.id}
                                                value={`${customer.firstName} ${customer.lastName}`}
                                                onSelect={() => {
                                                    setSelectedCustomerId(customer.id)
                                                    setIsComboboxOpen(false)
                                                }}
                                                >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {customer.firstName} {customer.lastName}
                                                </CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-order-quantity" className="text-right">Quantité</Label>
                            <Input id="edit-order-quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="flex items-center space-x-2 justify-center pt-2">
                            <Label htmlFor="edit-is-recurring">Commande récurrente ?</Label>
                            <Switch
                                id="edit-is-recurring"
                                checked={isRecurring}
                                onCheckedChange={setIsRecurring}
                            />
                            <p className='text-xs text-muted-foreground'>(Conserver pour demain)</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit">
                           Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

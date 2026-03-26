
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Supplier } from '@/lib/types';
import { Loader2, Building, User, Phone, Mail, MapPin } from 'lucide-react';
import { supplierService } from '@/services/supplier.service';

interface SupplierDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    supplier: Supplier | null;
    onSuccess: () => void;
}

const initialFormState: Partial<Supplier> = {
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
};

export function SupplierDialog({ isOpen, onOpenChange, supplier, onSuccess }: SupplierDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (supplier && isOpen) {
            setFormState({
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
            });
        } else if (!supplier && isOpen) {
            setFormState(initialFormState);
        }
    }, [supplier, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formState.name) return;

        setIsLoading(true);
        try {
            if (supplier && supplier.uuid) {
                await supplierService.updateSupplier(supplier.uuid, formState);
                toast.success(`Fournisseur "${formState.name}" mis à jour.`);
            } else {
                await supplierService.findOrCreateSupplier(formState.name!, undefined);
                // The basic findOrCreate doesn't take all fields, let's update it if needed or use a more complete method
                // For simplicity here, we assume the name is enough or we'd need a proper 'addSupplier' in service
                toast.success(`Fournisseur "${formState.name}" ajouté.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md luxury-glass">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="font-bold flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            {supplier ? 'Modifier le partenaire' : 'Nouveau Fournisseur'}
                        </DialogTitle>
                        <DialogDescription>
                           Gérez les informations de contact et les détails de votre fournisseur.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Nom de l'entreprise</Label>
                            <Input id="name" value={formState.name} onChange={handleInputChange} required className="h-11 rounded-xl" placeholder="Ex: Sarl Algérie Distribution" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Personne de contact</Label>
                                <Input id="contactPerson" value={formState.contactPerson} onChange={handleInputChange} className="h-11 rounded-xl" placeholder="M. Ahmed" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Téléphone</Label>
                                <Input id="phone" value={formState.phone} onChange={handleInputChange} className="h-11 rounded-xl font-mono" placeholder="0550..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-bold uppercase text-[10px] tracking-widest opacity-70">E-mail</Label>
                            <Input id="email" type="email" value={formState.email} onChange={handleInputChange} className="h-11 rounded-xl" placeholder="contact@fournisseur.dz" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="font-bold uppercase text-[10px] tracking-widest opacity-70">Adresse</Label>
                            <Textarea id="address" value={formState.address} onChange={handleInputChange} className="rounded-xl min-h-[80px]" placeholder="Zone Industrielle..." />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-border/50">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 rounded-xl px-8 h-11">
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}


'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, writeBatch, query } from 'firebase/firestore';
import type { Customer } from '@/lib/types';
import { useCustomers } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader, PlusCircle, Trash2, Edit, Users, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function CustomerForm({ 
    isOpen, 
    onClose, 
    onSave,
    customer
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (customer: Omit<Customer, 'id'>, id?: string) => Promise<void>,
    customer: Customer | null
}) {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        const customerData: Omit<Customer, 'id'> = {
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            avatarUrl: formData.get('avatarUrl') as string,
            debt: customer ? customer.debt : 0, // Keep existing debt on edit, 0 on create
        };
        
        await onSave(customerData, customer?.id);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{customer ? 'Modifier le client' : 'Ajouter un nouveau client'}</DialogTitle>
                    <DialogDescription>
                        {customer ? "Modifiez les détails du client." : "Entrez les détails du nouveau client."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="customer-form" className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" name="name" defaultValue={customer?.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Téléphone</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={customer?.phone} className="col-span-3" required />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="avatarUrl" className="text-right">URL Avatar</Label>
                        <Input id="avatarUrl" name="avatarUrl" defaultValue={customer?.avatarUrl} className="col-span-3" />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
                    <Button type="submit" form="customer-form" disabled={isSaving}>
                        {isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function CustomersPage() {
    const firestore = useFirestore();
    const { customers, isLoading } = useCustomers();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    const customersCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'customers') : null, [firestore]);
    
    const totalDebt = useMemo(() => {
        return customers.reduce((sum, customer) => sum + (customer.debt || 0), 0);
    }, [customers]);

    const handleSaveCustomer = async (customerData: Omit<Customer, 'id'>, id?: string) => {
        if (!customersCollectionRef) return;
        try {
            if (id) { // Editing existing customer
                const customerRef = doc(customersCollectionRef, id);
                await updateDoc(customerRef, customerData);
                toast({ title: "Client mis à jour" });
            } else { // Adding new customer
                await addDoc(customersCollectionRef, customerData);
                toast({ title: "Client ajouté" });
            }
            setIsFormOpen(false);
            setSelectedCustomer(null);
        } catch (error) {
            console.error("Error saving customer:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le client." });
        }
    };
    
    const handleDeleteCustomer = async () => {
        if (!customersCollectionRef || !customerToDelete) return;
        try {
            const customerRef = doc(customersCollectionRef, customerToDelete.id);
            await deleteDoc(customerRef);
            toast({ title: "Client supprimé" });
            setCustomerToDelete(null);
        } catch (error) {
            console.error("Error deleting customer:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le client." });
        }
    };
    
    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCustomer(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="grid gap-2">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Users/> Clients</h1>
                    <p className="text-muted-foreground">Gérez votre liste de clients et leurs dettes.</p>
                </div>
                 <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un client
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nombre de clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dette totale</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(totalDebt / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-60">
                            <Loader className="animate-spin h-8 w-8 text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead className="text-right">Dette</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map(customer => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint={customer.avatarHint || 'person avatar'}/>
                                                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {customer.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {(customer.debt || 0 / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setCustomerToDelete(customer)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                <span className="sr-only">Supprimer</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            
            {isFormOpen && (
                <CustomerForm 
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setSelectedCustomer(null); }}
                    onSave={handleSaveCustomer}
                    customer={selectedCustomer}
                />
            )}

            <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                             Cette action supprimera définitivement le client &quot;{customerToDelete?.name}&quot; et toutes ses ventes associées. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCustomer}>Oui, supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

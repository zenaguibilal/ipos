
'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import type { Supplier } from '@/lib/types';
import { useSuppliers } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader, PlusCircle, Trash2, Edit, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function SupplierForm({ 
    isOpen, 
    onClose, 
    onSave,
    supplier
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (supplier: Omit<Supplier, 'id'>, id?: string) => Promise<void>,
    supplier: Supplier | null
}) {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        const supplierData: Omit<Supplier, 'id'> = {
            name: formData.get('name') as string,
            contactName: formData.get('contactName') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
        };
        
        await onSave(supplierData, supplier?.id);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{supplier ? 'Modifier le fournisseur' : 'Ajouter un nouveau fournisseur'}</DialogTitle>
                    <DialogDescription>
                        {supplier ? "Modifiez les détails du fournisseur." : "Entrez les détails du nouveau fournisseur."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="supplier-form" className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nom</Label>
                        <Input id="name" name="name" defaultValue={supplier?.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contactName" className="text-right">Contact</Label>
                        <Input id="contactName" name="contactName" defaultValue={supplier?.contactName} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Téléphone</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={supplier?.phone} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={supplier?.email} className="col-span-3" />
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
                    <Button type="submit" form="supplier-form" disabled={isSaving}>
                        {isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : 'Enregistrer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SuppliersPage() {
    const firestore = useFirestore();
    const { suppliers, isLoading } = useSuppliers();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

    const suppliersCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'suppliers') : null, [firestore]);
    
    const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id'>, id?: string) => {
        if (!suppliersCollectionRef) return;
        try {
            if (id) { // Editing existing supplier
                const supplierRef = doc(suppliersCollectionRef, id);
                await updateDoc(supplierRef, supplierData);
                toast({ title: "Fournisseur mis à jour" });
            } else { // Adding new supplier
                await addDoc(suppliersCollectionRef, supplierData);
                toast({ title: "Fournisseur ajouté" });
            }
            setIsFormOpen(false);
            setSelectedSupplier(null);
        } catch (error) {
            console.error("Error saving supplier:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer le fournisseur." });
        }
    };
    
    const handleDeleteSupplier = async () => {
        if (!suppliersCollectionRef || !supplierToDelete) return;
        try {
            // A real app should check if there are products associated with this supplier first.
            const supplierRef = doc(suppliersCollectionRef, supplierToDelete.id);
            await deleteDoc(supplierRef);
            toast({ title: "Fournisseur supprimé" });
            setSupplierToDelete(null);
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le fournisseur. Assurez-vous qu'aucun produit n'est lié à ce fournisseur." });
        }
    };
    
    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setSelectedSupplier(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div className="grid gap-2">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Building/> Fournisseurs</h1>
                    <p className="text-muted-foreground">Gérez votre liste de fournisseurs.</p>
                </div>
                 <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un fournisseur
                </Button>
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
                                    <TableHead>Nom du fournisseur</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.map(supplier => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.contactName}</TableCell>
                                        <TableCell>{supplier.phone}</TableCell>
                                        <TableCell>{supplier.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Modifier</span>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setSupplierToDelete(supplier)}>
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
                <SupplierForm 
                    isOpen={isFormOpen}
                    onClose={() => { setIsFormOpen(false); setSelectedSupplier(null); }}
                    onSave={handleSaveSupplier}
                    supplier={selectedSupplier}
                />
            )}

            <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement le fournisseur &quot;{supplierToDelete?.name}&quot;. Les produits associés ne seront plus liés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSupplier}>Oui, supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

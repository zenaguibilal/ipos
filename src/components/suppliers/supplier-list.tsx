'use client';
import { useState } from 'react';
import type { Supplier } from '@/lib/types';
import { MoreHorizontal, PlusCircle, HandCoins, Wallet, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, increment } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function SettleDebtDialog({ supplier, isOpen, onClose, onSettle }: { supplier: Supplier, isOpen: boolean, onClose: () => void, onSettle: (amount: number) => void }) {
    const [amount, setAmount] = useState<number | string>('');

    const handleSettle = () => {
        const paymentAmount = Number(amount);
        if (paymentAmount > 0 && paymentAmount <= (supplier.debt || 0) / 100) {
            onSettle(paymentAmount);
            onClose();
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Régler la dette de {supplier.name}</DialogTitle>
                    <DialogDescription>
                        Le solde actuel de la dette est de <strong>{((supplier.debt || 0) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="settle-amount">Montant à régler (DZD)</Label>
                    <Input
                        id="settle-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Entrez le montant"
                        max={(supplier.debt || 0) / 100}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleSettle} disabled={Number(amount) <= 0 || Number(amount) > (supplier.debt || 0) / 100}>Régler</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function SupplierForm({ supplier, onSave, onCancel }: { supplier: Partial<Supplier> | null, onSave: (s: Omit<Supplier, 'id' | 'debt'> & { id?: string }) => void, onCancel: () => void }) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSupplierData = {
            id: supplier?.id,
            name: formData.get('name') as string,
            contactEmail: formData.get('email') as string,
            contactPhone: formData.get('phone') as string,
            contactName: formData.get('contactPerson') as string,
            visitingDays: formData.get('visitingDays') as string,
        };
        onSave(newSupplierData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader className="p-6">
                <SheetTitle>{supplier?.id ? 'Modifier le Fournisseur' : 'Ajouter un Fournisseur'}</SheetTitle>
                <SheetDescription>
                    Remplissez les détails du fournisseur. Cliquez sur enregistrer lorsque vous avez terminé.
                </SheetDescription>
            </SheetHeader>
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                <div>
                    <Label htmlFor="name">Nom de l'entreprise</Label>
                    <Input id="name" name="name" defaultValue={supplier?.name} required />
                </div>
                 <div>
                    <Label htmlFor="contactPerson">Personne à contacter</Label>
                    <Input id="contactPerson" name="contactPerson" defaultValue={supplier?.contactName} />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={supplier?.contactEmail} required />
                </div>
                 <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" type="tel" defaultValue={supplier?.contactPhone} />
                </div>
                 <div>
                    <Label htmlFor="visitingDays">Jours de visite (ex: Lundi, Mercredi)</Label>
                    <Input id="visitingDays" name="visitingDays" defaultValue={supplier?.visitingDays} />
                </div>
            </div>
            <SheetFooter className="p-6 bg-muted/40 border-t">
                <Button variant="outline" type="button" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Enregistrer le Fournisseur</Button>
            </SheetFooter>
        </form>
    );
}

function SupplierRow({ supplier, onDelete, onEdit }: { supplier: Supplier, onDelete: (id: string) => void, onEdit: (s: Supplier) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSettleDebtOpen, setIsSettleDebtOpen] = useState(false);

    const handleSettleDebt = (amountInDZD: number) => {
        const amountInCents = amountInDZD * 100;
        const supplierRef = doc(firestore, 'suppliers', supplier.id);
        updateDocumentNonBlocking(supplierRef, {
            debt: increment(-amountInCents)
        });
        toast({
            title: "Règlement enregistré",
            description: `${(amountInDZD).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD' })} ont été réglés pour ${supplier.name}.`
        });
    };

    return (
        <>
            <TableRow>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.contactName || 'N/A'}</TableCell>
                <TableCell>{supplier.contactPhone || 'N/A'}</TableCell>
                <TableCell className="hidden md:table-cell">{supplier.visitingDays || 'N/A'}</TableCell>
                 <TableCell>
                    <div className="flex items-center gap-2">
                        {supplier.debt && supplier.debt > 0 ? (
                            <Badge variant="destructive">
                                {(supplier.debt / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
                            </Badge>
                        ) : (
                             <Badge variant="outline">0 DZD</Badge>
                        )}
                         {supplier.debt && supplier.debt > 0 && (
                            <Button variant="outline" size="sm" className="h-7" onClick={() => setIsSettleDebtOpen(true)}>
                                <HandCoins className="h-3.5 w-3.5" />
                                <span className="sr-only">Régler la dette</span>
                            </Button>
                        )}
                    </div>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ouvrir/fermer le menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(supplier)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(supplier.id)} className="text-destructive">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {isSettleDebtOpen && (
                <SettleDebtDialog
                    supplier={supplier}
                    isOpen={isSettleDebtOpen}
                    onClose={() => setIsSettleDebtOpen(false)}
                    onSettle={handleSettleDebt}
                />
            )}
        </>
    );
}

export function SupplierList({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const suppliersRef = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const totalDebt = initialSuppliers.reduce((acc, supplier) => acc + (supplier.debt || 0), 0);

    const handleAddClick = () => {
        setEditingSupplier({});
        setIsSheetOpen(true);
    };

    const handleEditClick = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsSheetOpen(true);
    };

    const handleDelete = (supplierId: string) => {
        const docRef = doc(firestore, 'suppliers', supplierId);
        deleteDocumentNonBlocking(docRef);
    };
    
    const handleSave = (supplierData: Omit<Supplier, 'id' | 'debt'> & { id?: string }) => {
        const id = supplierData.id || `supp_${Date.now()}`;
        const docRef = doc(suppliersRef, id);

        const dataToSave: Partial<Supplier> = { ...supplierData };
        delete dataToSave.id;

        if (!supplierData.id) { // New supplier
            dataToSave.debt = 0;
        }

        setDocumentNonBlocking(docRef, dataToSave, { merge: true });

        setIsSheetOpen(false);
        setEditingSupplier(null);
    };

    const filteredSuppliers = initialSuppliers.filter(supplier => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            supplier.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            (supplier.contactName && supplier.contactName.toLowerCase().includes(lowerCaseSearchTerm)) ||
            (supplier.contactPhone && supplier.contactPhone.toLowerCase().includes(lowerCaseSearchTerm))
        );
    });

    return (
        <>
            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <div className="grid gap-2">
                            <CardTitle>Fournisseurs</CardTitle>
                            <CardDescription>Gérez vos fournisseurs et suivez les factures.</CardDescription>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            <div className="flex items-center gap-2 text-lg font-semibold text-destructive">
                                <Wallet className="h-6 w-6" />
                                <span>
                                    {(totalDebt / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
                                </span>
                            </div>
                            <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Ajouter un Fournisseur</span>
                            </Button>
                        </div>
                    </div>
                     <div className="relative mt-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Rechercher par nom, contact, ou téléphone..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Entreprise</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead className="hidden md:table-cell">Jours de visite</TableHead>
                                <TableHead>Dette</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSuppliers.map((supplier) => (
                                <SupplierRow key={supplier.id} supplier={supplier} onDelete={handleDelete} onEdit={handleEditClick} />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg p-0">
                   <SupplierForm supplier={editingSupplier} onSave={handleSave} onCancel={() => setIsSheetOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}

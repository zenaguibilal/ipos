'use client';
import { useState } from 'react';
import type { Supplier } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

function SupplierForm({ supplier, onSave, onCancel }: { supplier: Partial<Supplier> | null, onSave: (s: Supplier) => void, onCancel: () => void }) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSupplier: Supplier = {
            id: supplier?.id || `supp_${Date.now()}`,
            name: formData.get('name') as string,
            contactEmail: formData.get('email') as string,
            contactPhone: formData.get('phone') as string,
            contactName: formData.get('contactPerson') as string,
        };
        onSave(newSupplier);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader className="p-6">
                <SheetTitle>{supplier?.id ? 'Edit Supplier' : 'Add Supplier'}</SheetTitle>
                <SheetDescription>
                    Fill in the supplier's details. Click save when you're done.
                </SheetDescription>
            </SheetHeader>
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input id="name" name="name" defaultValue={supplier?.name} required />
                </div>
                 <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input id="contactPerson" name="contactPerson" defaultValue={supplier?.contactName} />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={supplier?.contactEmail} required />
                </div>
                 <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" defaultValue={supplier?.contactPhone} />
                </div>
            </div>
            <SheetFooter className="p-6 bg-muted/40 border-t">
                <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Supplier</Button>
            </SheetFooter>
        </form>
    );
}

export function SupplierList({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const suppliersRef = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
    
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

    const handleAddClick = () => {
        setEditingSupplier({ id: user?.uid });
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
    
    const handleSave = (supplier: Supplier) => {
        const { id, ...supplierData } = supplier;
        if (!id) return;
        const docRef = doc(suppliersRef, id);
        setDocumentNonBlocking(docRef, supplierData, { merge: true });

        setIsSheetOpen(false);
        setEditingSupplier(null);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Suppliers</CardTitle>
                        <CardDescription>Manage your suppliers and track invoices.</CardDescription>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Supplier</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead className="hidden md:table-cell">Contact Person</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialSuppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell className="hidden md:table-cell">{supplier.contactName}</TableCell>
                                    <TableCell className="hidden md:table-cell">{supplier.contactEmail}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEditClick(supplier)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(supplier.id)} className="text-destructive">Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
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

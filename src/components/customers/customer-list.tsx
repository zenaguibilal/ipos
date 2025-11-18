'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { Customer, Sale } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFirestore, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function CustomerForm({ customer, onSave, onCancel }: { customer: Partial<Customer> | null, onSave: (c: Omit<Customer, 'id'> & { id?: string }) => void, onCancel: () => void }) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newCustomerData: Omit<Customer, 'id' | 'avatarUrl' | 'avatarHint' | 'debt'> & { id?: string } = {
            id: customer?.id,
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            settlementDay: Number(formData.get('settlementDay')),
        };
        onSave(newCustomerData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader className="p-6">
                <SheetTitle>{customer?.id ? 'Modifier le Client' : 'Ajouter un Client'}</SheetTitle>
                <SheetDescription>
                    Remplissez les détails du client. Cliquez sur enregistrer lorsque vous avez terminé.
                </SheetDescription>
            </SheetHeader>
            <div className="flex-grow p-6 space-y-4 overflow-y-auto">
                <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" name="name" defaultValue={customer?.name} required />
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={customer?.email} required />
                </div>
                 <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" type="tel" defaultValue={customer?.phone} />
                </div>
                 <div>
                    <Label htmlFor="settlementDay">Jour de règlement</Label>
                    <Input id="settlementDay" name="settlementDay" type="number" defaultValue={customer?.settlementDay} min="1" max="31" />
                </div>
            </div>
            <SheetFooter className="p-6 bg-muted/40 border-t">
                <Button variant="outline" type="button" onClick={onCancel}>Annuler</Button>
                <Button type="submit">Enregistrer le Client</Button>
            </SheetFooter>
        </form>
    );
}

function CustomerRow({ customer }: { customer: Customer }) {
    const firestore = useFirestore();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

    const salesRef = useMemoFirebase(() => query(collection(firestore, `customers/${customer.id}/sales`)), [firestore, customer.id]);
    const { data: sales, isLoading: salesLoading } = useCollection<Sale>(salesRef);

    const totalSales = sales ? sales.reduce((acc, sale) => acc + sale.totalAmount, 0) : 0;
    
    const customersRef = useMemoFirebase(() => collection(firestore, 'customers'), [firestore]);

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsSheetOpen(true);
    };

    const handleDelete = (customerId: string) => {
        const docRef = doc(firestore, 'customers', customerId);
        deleteDocumentNonBlocking(docRef);
    };

    const handleSave = (customerData: Omit<Customer, 'id' | 'avatarUrl' | 'avatarHint'> & { id?: string }) => {
        const id = customerData.id || `cust_${Date.now()}`;
        const docRef = doc(customersRef, id);
        
        const dataToSave: Partial<Customer> = { ...customerData };
        delete dataToSave.id;

        if (!customerData.id) { // New customer
            dataToSave.avatarUrl = `https://picsum.photos/seed/${id}/100/100`;
            dataToSave.avatarHint = 'person portrait';
            dataToSave.debt = 0;
        }
        
        setDocumentNonBlocking(docRef, dataToSave, { merge: true });
        
        setIsSheetOpen(false);
        setEditingCustomer(null);
    };

    return (
        <>
            <TableRow>
                <TableCell>
                    <div className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                                <Image src={customer.avatarUrl || `https://picsum.photos/seed/${customer.id}/100/100`} alt={`Avatar de ${customer.name}`} width={36} height={36} data-ai-hint={'person portrait'} />
                                <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <p className="text-sm font-medium leading-none">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                    </div>
                </TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell className="text-center">{customer.settlementDay || 'N/A'}</TableCell>
                 <TableCell>
                    {salesLoading ? '...' : (
                        <Badge variant="secondary">
                            {(totalSales / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                    {customer.debt && customer.debt > 0 ? (
                        <Badge variant="destructive">
                            {(customer.debt / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}
                        </Badge>
                    ) : (
                        <Badge variant="outline">
                            0 DZD
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                    {sales && sales.length > 0 ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">{sales.length} Factures</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Dernières factures</DropdownMenuLabel>
                                {sales.slice(0, 5).map(sale => (
                                    <DropdownMenuItem key={sale.id} className="flex justify-between">
                                        <span>{format(new Date(sale.saleDate), "d MMM yy", { locale: fr })}</span>
                                        <span>{(sale.totalAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <span>0 Factures</span>
                    )}
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
                            <DropdownMenuItem onClick={() => handleEditClick(customer)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(customer.id)} className="text-destructive">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg p-0">
                   <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsSheetOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    )
}

export function CustomerList({ initialCustomers }: { initialCustomers: Customer[] }) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleAddClick = () => {
        setIsSheetOpen(true);
    };

    const handleSave = (customerData: Omit<Customer, 'id' | 'avatarUrl' | 'avatarHint'> & { id?: string }) => {
        const firestore = useFirestore();
        const customersRef = collection(firestore, 'customers');
        const id = `cust_${Date.now()}`;
        const docRef = doc(customersRef, id);
        
        const dataToSave: Partial<Customer> = { ...customerData };
        delete dataToSave.id;

        dataToSave.avatarUrl = `https://picsum.photos/seed/${id}/100/100`;
        dataToSave.avatarHint = 'person portrait';
        dataToSave.debt = 0;
        
        setDocumentNonBlocking(docRef, dataToSave, { merge: true });
        
        setIsSheetOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center">
                     <div className="grid gap-2">
                        <CardTitle>Clients</CardTitle>
                        <CardDescription>Gérez vos clients et consultez leur historique d'achats.</CardDescription>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Ajouter un Client</span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead>Jour de règlement</TableHead>
                                <TableHead>Ventes totales</TableHead>
                                <TableHead>Dette</TableHead>
                                <TableHead>Factures</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialCustomers.map((customer) => (
                               <CustomerRow key={customer.id} customer={customer} />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-lg p-0">
                   <CustomerForm customer={null} onSave={handleSave} onCancel={() => setIsSheetOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}

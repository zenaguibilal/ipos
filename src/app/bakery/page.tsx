'use client';
import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import type { BakeryOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader, PlusCircle, Trash2, Cookie, Wheat, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function BakeryOrderForm({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (order: Omit<BakeryOrder, 'id' | 'isFulfilled'>) => Promise<void> }) {
    const [isSaving, setIsSaving] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isRecurring, setIsRecurring] = useState(false);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const newOrder: Omit<BakeryOrder, 'id' | 'isFulfilled'> = {
            customerName: formData.get('customerName') as string,
            quantity: Number(formData.get('quantity')),
            type: formData.get('type') as 'bread' | 'meloui',
            paymentStatus: formData.get('paymentStatus') as 'paid' | 'unpaid',
            orderDate: date ? date.toISOString() : new Date().toISOString(),
            isRecurring: isRecurring,
        };
        await onSave(newOrder);
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Ajouter une nouvelle commande</DialogTitle>
                    <DialogDescription>
                        Entrez les détails de la nouvelle commande.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} id="bakery-order-form" className="space-y-4 p-6 pt-4">
                    <div>
                        <Label htmlFor="customerName">Nom du client</Label>
                        <Input id="customerName" name="customerName" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" defaultValue="bread">
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisissez le type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bread">Pain</SelectItem>
                                    <SelectItem value="meloui">Meloui</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="quantity">Quantité</Label>
                            <Input id="quantity" name="quantity" type="number" required min="1" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="paymentStatus">Statut du paiement</Label>
                            <Select name="paymentStatus" defaultValue="unpaid">
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisissez le statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid">Payée</SelectItem>
                                    <SelectItem value="unpaid">Non payée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label>Date de la commande</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "d MMM yyyy", { locale: fr }) : <span>Choisissez une date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                         </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch id="isRecurring" name="isRecurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                        <Label htmlFor="isRecurring">Commande récurrente quotidienne</Label>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
                    <Button type="submit" form="bakery-order-form" disabled={isSaving}>
                        {isSaving ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : 'Enregistrer la commande'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">unités commandées (non livrées)</p>
            </CardContent>
        </Card>
    );
}


function BakeryTable({ orders, onFulfillToggle, onPaymentStatusChange, onDelete, isFulfilledTable = false }: { orders: BakeryOrder[], onFulfillToggle: (order: BakeryOrder) => void, onPaymentStatusChange: (order: BakeryOrder, newStatus: 'paid' | 'unpaid') => void, onDelete: (orderId: string) => void, isFulfilledTable?: boolean }) {
    
    if (orders.length === 0) {
        return (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
                {isFulfilledTable ? 'Aucune commande terminée.' : 'Aucune commande active pour le moment.'}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom du client</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date de la commande</TableHead>
                    <TableHead>Statut du paiement</TableHead>
                    <TableHead className="text-center">Statut de la livraison</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.map(order => (
                    <BakeryTableRow 
                        key={order.id} 
                        order={order} 
                        onFulfillToggle={onFulfillToggle} 
                        onPaymentStatusChange={onPaymentStatusChange} 
                        onDelete={onDelete}
                    />
                ))}
            </TableBody>
        </Table>
    );
}

function BakeryTableRow({ order, onFulfillToggle, onPaymentStatusChange, onDelete }: { order: BakeryOrder, onFulfillToggle: (order: BakeryOrder) => void, onPaymentStatusChange: (order: BakeryOrder, newStatus: 'paid' | 'unpaid') => void, onDelete: (orderId: string) => void }) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    return (
        <>
            <TableRow className={order.isFulfilled ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium flex items-center gap-2">
                    {order.customerName}
                    {order.isRecurring && <Repeat className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell className="text-center">{order.quantity}</TableCell>
                <TableCell>
                     <Badge variant={order.type === 'bread' ? 'secondary' : 'outline'} className="gap-1">
                        {order.type === 'bread' ? <Wheat className="h-3 w-3" /> : <Cookie className="h-3 w-3" />}
                        {order.type === 'bread' ? 'Pain' : 'Meloui'}
                    </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.orderDate), "d MMM yyyy, HH:mm", { locale: fr })}
                </TableCell>
                <TableCell>
                    <Select
                        value={order.paymentStatus}
                        onValueChange={(newStatus: 'paid' | 'unpaid') => onPaymentStatusChange(order, newStatus)}
                    >
                        <SelectTrigger className={`w-[110px] text-xs h-8 ${order.paymentStatus === 'paid' ? 'border-green-500 text-green-700 focus:ring-green-500' : 'border-red-500 text-red-700 focus:ring-red-500'}`}>
                            <SelectValue placeholder="Statut du paiement" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="paid">Payée</SelectItem>
                            <SelectItem value="unpaid">Non payée</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                    <div className="flex items-center justify-center">
                        <Switch
                            id={`fulfill-switch-${order.id}`}
                            checked={order.isFulfilled}
                            onCheckedChange={() => onFulfillToggle(order)}
                            aria-label="Statut de la livraison"
                        />
                    </div>
                </TableCell>
                <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Supprimer</span>
                    </Button>
                </TableCell>
            </TableRow>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement la commande. Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(order.id)}>
                            Oui, supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function BakeryPage() {
    const firestore = useFirestore();
    const bakeryOrdersColRef = useMemoFirebase(() => collection(firestore, 'bakery_orders'), [firestore]);
    const { data: orders, isLoading } = useCollection<BakeryOrder>(bakeryOrdersColRef);
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const { activeOrders, fulfilledOrders } = useMemo(() => {
        const sorted = orders ? [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()) : [];
        return {
            activeOrders: sorted.filter(order => !order.isFulfilled),
            fulfilledOrders: sorted.filter(order => order.isFulfilled),
        };
    }, [orders]);

    const breadOrdersQuantity = useMemo(() => {
        return activeOrders.filter(order => order.type === 'bread').reduce((sum, order) => sum + order.quantity, 0) || 0;
    }, [activeOrders]);

    const melouiOrdersQuantity = useMemo(() => {
        return activeOrders.filter(order => order.type === 'meloui').reduce((sum, order) => sum + order.quantity, 0) || 0;
    }, [activeOrders]);

    const handleSaveOrder = async (orderData: Omit<BakeryOrder, 'id' | 'isFulfilled'>) => {
        if (!firestore) return;
        const orderWithFulfillment = {
            ...orderData,
            isFulfilled: false,
        };
        try {
            await addDoc(bakeryOrdersColRef, orderWithFulfillment);
            toast({
                title: "Commande enregistrée",
                description: `La commande de ${orderData.customerName} a été enregistrée avec succès.`,
            });
            setIsFormOpen(false);
        } catch (error) {
            console.error("Error saving order:", error);
            toast({
                variant: "destructive",
                title: "Erreur d'enregistrement",
                description: "Nous n'avons pas pu enregistrer la commande. Veuillez réessayer.",
            });
        }
    };

    const handleFulfillToggle = async (order: BakeryOrder) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'bakery_orders', order.id);
        try {
            await updateDoc(orderRef, { isFulfilled: !order.isFulfilled });
            toast({
                title: "Statut mis à jour",
                description: `Le statut de livraison de la commande de ${order.customerName} a été mis à jour.`,
            });
        } catch (error) {
            console.error("Error updating fulfillment status:", error);
            toast({
                variant: "destructive",
                title: "Erreur de mise à jour",
                description: "Nous n'avons pas pu mettre à jour le statut de livraison. Veuillez réessayer.",
            });
        }
    };
    
    const handlePaymentStatusChange = async (order: BakeryOrder, newStatus: 'paid' | 'unpaid') => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'bakery_orders', order.id);
        try {
            await updateDoc(orderRef, { paymentStatus: newStatus });
            toast({
                title: "Statut du paiement mis à jour",
                description: `Le statut du paiement de la commande de ${order.customerName} a été mis à jour.`,
            });
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast({
                variant: "destructive",
                title: "Erreur de mise à jour",
                description: "Nous n'avons pas pu mettre à jour le statut du paiement. Veuillez réessayer.",
            });
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'bakery_orders', orderId);
        try {
            await deleteDoc(orderRef);
            toast({
                title: "Commande supprimée",
            });
        } catch (error) {
            console.error("Error deleting order:", error);
            toast({
                variant: "destructive",
                title: "Erreur de suppression",
                description: "Nous n'avons pas pu supprimer la commande. Veuillez réessayer.",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div className="grid gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Commandes de Pâtisserie</h1>
                    <p className="text-muted-foreground">Gérez et suivez les commandes quotidiennes de pain et de meloui.</p>
                </div>
                 <Button size="sm" className="h-9 gap-1" onClick={() => setIsFormOpen(true)}>
                    <PlusCircle className="h-4 w-4" />
                    <span className="whitespace-nowrap">Ajouter une commande</span>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <StatCard title="Total Pain" value={breadOrdersQuantity} icon={<Wheat className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Total Meloui" value={melouiOrdersQuantity} icon={<Cookie className="h-4 w-4 text-muted-foreground" />} />
            </div>
            
            <Tabs defaultValue="active">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">
                        Commandes Actives ({activeOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="fulfilled">
                        Commandes Terminées ({fulfilledOrders.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="active">
                    <Card>
                        <CardContent className="pt-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-60">
                                    <Loader className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            ) : (
                                <BakeryTable 
                                    orders={activeOrders} 
                                    onFulfillToggle={handleFulfillToggle} 
                                    onPaymentStatusChange={handlePaymentStatusChange} 
                                    onDelete={handleDeleteOrder} 
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="fulfilled">
                    <Card>
                        <CardContent className="pt-6">
                             {isLoading ? (
                                <div className="flex justify-center items-center h-60">
                                    <Loader className="animate-spin h-8 w-8 text-primary" />
                                </div>
                            ) : (
                                <BakeryTable 
                                    orders={fulfilledOrders} 
                                    onFulfillToggle={handleFulfillToggle} 
                                    onPaymentStatusChange={handlePaymentStatusChange} 
                                    onDelete={handleDeleteOrder}
                                    isFulfilledTable={true}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <BakeryOrderForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveOrder} />
        </div>
    );
}

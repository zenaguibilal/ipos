
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { DailyBreadOrder, BreadOrder } from '@/lib/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SetOrderDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    order: BreadOrder;
    date: Date;
    userId: string;
}

export function SetOrderDialog({ isOpen, onOpenChange, order, date, userId }: SetOrderDialogProps) {
    const firestore = useFirestore();
    const [quantity, setQuantity] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (order) {
            setQuantity(String(order.todaysOrder?.quantity ?? order.defaultOrderQuantity));
        }
    }, [order, isOpen]);

    const dateKey = format(date, 'yyyy-MM-dd');
    const isDefaultQuantity = parseInt(quantity, 10) === order.defaultOrderQuantity;
    const isProcessed = !!order.todaysOrder?.saleId; // Retained for safety, though UI might hide this now

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (isProcessed) {
            toast.warning("Impossible de modifier une commande pour laquelle une vente a déjà été générée.");
            return;
        }

        setIsLoading(true);

        const newQuantity = parseInt(quantity, 10);
        if (isNaN(newQuantity) || newQuantity < 0) {
            toast.error("Veuillez entrer une quantité valide.");
            setIsLoading(false);
            return;
        }

        if (!firestore) return;

        try {
            // If the new quantity is the default and a custom order exists, delete the custom order
            if (isDefaultQuantity && order.todaysOrder?.id && !isProcessed) {
                const orderRef = doc(firestore, 'users', userId, 'dailyBreadOrders', order.todaysOrder.id);
                await deleteDocumentNonBlocking(orderRef, {});
                toast.success(`Commande pour ${order.name} réinitialisée à la valeur par défaut.`);
            } 
            // If the quantity is different from default, create or update the daily order
            else if (!isDefaultQuantity) {
                const orderRef = order.todaysOrder?.id 
                    ? doc(firestore, 'users', userId, 'dailyBreadOrders', order.todaysOrder.id)
                    : doc(collection(firestore, 'users', userId, 'dailyBreadOrders'));
                
                const orderData: Partial<DailyBreadOrder> = {
                    breadCustomerId: order.id,
                    customerName: order.name,
                    quantity: newQuantity,
                    date: dateKey,
                    isPaid: order.todaysOrder?.isPaid ?? false,
                    isDelivered: order.todaysOrder?.isDelivered ?? false,
                    createdAt: order.todaysOrder?.id ? undefined : serverTimestamp(),
                };
                
                await setDocumentNonBlocking(orderRef, orderData, { merge: true });
                toast.success(`Commande pour ${order.name} mise à jour à ${newQuantity}.`);
            }
            onOpenChange(false);
        } catch (error) {
            toast.error("Erreur lors de la mise à jour de la commande.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Commande pour {order.name}</DialogTitle>
                        <DialogDescription>
                            Date: {format(date, 'd MMMM yyyy', { locale: fr })}
                        </DialogDescription>
                    </DialogHeader>
                    {isProcessed && (
                        <div className="my-2 p-3 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded-md text-sm flex items-center gap-2">
                           <AlertCircle className="h-4 w-4"/> Une vente a déjà été générée. Les modifications sont désactivées.
                        </div>
                    )}
                    <div className="py-4">
                        <Label htmlFor="quantity">Quantité de pain</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="mt-2 text-2xl h-14 text-center"
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            disabled={isProcessed}
                        />
                        <div className="mt-4 flex justify-around">
                            <Button type="button" variant="outline" onClick={() => setQuantity(String(order.defaultOrderQuantity))} disabled={isProcessed}>Par défaut ({order.defaultOrderQuantity})</Button>
                            <Button type="button" variant="outline" onClick={() => setQuantity('0')} disabled={isProcessed}>Zéro</Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading || isProcessed}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

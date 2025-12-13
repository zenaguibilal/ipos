
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Payment } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../ui/button';
import { Receipt } from 'lucide-react';
import { safeToDate } from '@/lib/utils';

interface PaymentDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    payment: Payment;
}

export function PaymentDetailsDialog({ isOpen, onOpenChange, payment }: PaymentDetailsDialogProps) {
    if (!payment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Receipt /> Détails du Paiement</DialogTitle>
                    <DialogDescription>
                        Récapitulatif du règlement de dette.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Client:</span>
                        <span className="font-medium">{payment.customerName || 'Client non spécifié'}</span>
                    </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Date du paiement:</span>
                        <span className="font-medium">{format(safeToDate(payment.createdAt), 'd LLL yyyy, HH:mm', { locale: fr })}</span>
                    </div>
                    <div className="mt-4 space-y-2 border-t pt-4">
                         <div className="flex justify-between font-semibold text-lg">
                            <span>Montant Réglé</span>
                            <span className="text-green-500">{payment.amount.toFixed(2)} DA</span>
                        </div>
                    </div>
                </div>
                 <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

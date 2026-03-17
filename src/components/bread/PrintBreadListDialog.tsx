'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';
import type { BreadOrder, BreadOrderWithClient, CompanyProfile } from '@/lib/types';
import { dataService } from '@/services/data-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintBreadListDialogProps {
    orders: BreadOrderWithClient[];
    currentDate: string;
}

const getStatusLabel = (order: BreadOrder) => {
    if (order.est_paye && order.est_livre) return 'Payé & Livré';
    if (order.est_paye) return 'Payé (non livré)';
    if (order.est_livre) return 'Livré (non payé)';
    return 'En attente';
};

const PrintableList = React.forwardRef<HTMLDivElement, PrintBreadListDialogProps & { profile: CompanyProfile | null }>(({ orders, currentDate, profile }, ref) => {
    const totalQuantity = orders.reduce((acc, order) => acc + order.quantite, 0);
    const formattedDate = format(new Date(currentDate.replace(/-/g, '/')), 'EEEE d MMMM yyyy', { locale: fr });
    
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans">
            <header className="text-center mb-4">
                <h1 className="text-xl font-bold">{profile?.companyName || 'Liste de Commandes'}</h1>
                <h2 className="text-lg">Commandes de Pain du {formattedDate}</h2>
            </header>
            <table className="w-full text-sm border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-gray-300 p-2 text-left">Client</th>
                        <th className="border border-gray-300 p-2 text-center w-24">Quantité</th>
                        <th className="border border-gray-300 p-2 text-left w-32">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} className="[&>td]:border [&>td]:border-gray-300 [&>td]:p-2">
                            <td>{order.client.nom}</td>
                            <td className="text-center font-bold">{order.quantite}</td>
                            <td>{getStatusLabel(order)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-200 font-bold">
                        <td className="border border-gray-300 p-2 text-right">Total</td>
                        <td className="border border-gray-300 p-2 text-center">{totalQuantity}</td>
                        <td className="border border-gray-300 p-2"></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
});
PrintableList.displayName = 'PrintableList';

export function PrintBreadListDialog({ orders, currentDate }: PrintBreadListDialogProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(isOpen) {
            dataService.getCompanyProfile().then(setProfile);
        }
    }, [isOpen]);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const listElement = printRef.current;

        if (!printableContent || !listElement) return;

        const listClone = listElement.cloneNode(true) as HTMLDivElement;
        listClone.classList.add('a4-receipt');

        printableContent.innerHTML = '';
        printableContent.appendChild(listClone);

        setTimeout(() => window.print(), 100);
    };

    return (
        <>
            <Button variant="outline" onClick={() => setIsOpen(true)}>
                <Printer className="mr-2 h-4 w-4" /> Imprimer la liste
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col print-dialog-content">
                    <DialogHeader className="print-hide">
                        <DialogTitle>Aperçu de la liste des commandes</DialogTitle>
                        <DialogDescription>Aperçu de la liste pour l'impression.</DialogDescription>
                    </DialogHeader>
                    <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-md">
                        <div id="label-print-area" className="bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '1cm' }}>
                            <PrintableList ref={printRef} orders={orders} currentDate={currentDate} profile={profile} />
                        </div>
                    </div>
                    <DialogFooter className="print-hide pt-4">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>
                        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

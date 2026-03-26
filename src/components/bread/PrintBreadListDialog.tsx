
'use client';

import React, { useRef, useState } from 'react';
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
import type { BreadOrder, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';

interface PrintBreadListDialogProps {
    orders: BreadOrder[];
    currentDate: string;
}

const getStatusLabel = (order: BreadOrder) => {
    if (order.est_paye && order.est_livre) return 'Payé & Livré';
    if (order.est_paye) return 'Payé (non livré)';
    if (order.est_livre) return 'Livré (non payé)';
    return 'En attente';
};

const PrintableList = React.forwardRef<HTMLDivElement, { orders: BreadOrder[], currentDate: string, profile: CompanyProfile | null }>(({ orders, currentDate, profile }, ref) => {
    const totalQuantity = orders.reduce((acc, order) => acc + order.quantite, 0);
    const formattedDate = format(new Date(currentDate.replace(/-/g, '/')), 'EEEE d MMMM yyyy', { locale: fr });
    
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans">
            <header className="text-center mb-4 border-b pb-2">
                <h1 className="text-xl font-bold">{profile?.companyName || 'Mon Commerce'}</h1>
                <h2 className="text-lg">Liste de Distribution Pain - {formattedDate}</h2>
            </header>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Commande (Client/Lieu)</th>
                        <th className="border p-2 text-center w-24">Quantité</th>
                        <th className="border p-2 text-left w-32">Statut</th>
                        <th className="border p-2 text-left w-24">Signature</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.uuid}>
                            <td className="border p-2 font-medium">{order.orderName}</td>
                            <td className="border p-2 text-center font-bold text-lg">{order.quantite}</td>
                            <td className="border p-2 text-xs">{getStatusLabel(order)}</td>
                            <td className="border p-2"></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td className="border p-2 text-right">TOTAL GÉNÉRAL</td>
                        <td className="border p-2 text-center text-lg">{totalQuantity}</td>
                        <td className="border p-2" colSpan={2}></td>
                    </tr>
                </tfoot>
            </table>
            <footer className="mt-8 flex justify-between text-xs italic">
                <p>Généré le {format(new Date(), 'Pp', { locale: fr })}</p>
                <p>Page 1 / 1</p>
            </footer>
        </div>
    );
});
PrintableList.displayName = 'PrintableList';

export function PrintBreadListDialog({ orders, currentDate }: PrintBreadListDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const profile = useAppStore((state) => state.profile);
    const printRef = useRef<HTMLDivElement>(null);

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
                        <DialogTitle>Aperçu de la liste de distribution</DialogTitle>
                        <DialogDescription>Aperçu optimisé pour impression A4.</DialogDescription>
                    </DialogHeader>
                    <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-md">
                        <div id="label-print-area" className="bg-white mx-auto shadow-sm" style={{ width: '210mm', minHeight: '297mm', padding: '1cm' }}>
                            <PrintableList ref={printRef} orders={orders} currentDate={currentDate} profile={profile || null} />
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

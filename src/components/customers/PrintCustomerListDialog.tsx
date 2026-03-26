
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
import type { Customer, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

interface PrintCustomerListDialogProps {
    customers: Customer[];
    title?: string;
}

const PrintableList = React.forwardRef<HTMLDivElement, { customers: Customer[], profile: CompanyProfile | null, title: string }>(({ customers, profile, title }, ref) => {
    const totalDebt = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
    const date = format(new Date(), 'Pp', { locale: fr });
    
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans">
            <header className="text-center mb-6 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase">{profile?.companyName || 'Mon Magasin'}</h1>
                <p className="text-sm">{profile?.address} {profile?.city}</p>
                <p className="text-sm">Tél: {profile?.phone}</p>
                <div className="mt-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <p className="text-xs italic">Généré le {date}</p>
                </div>
            </header>

            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Client</th>
                        <th className="border p-2 text-left">Téléphone</th>
                        <th className="border p-2 text-right">Total Dépensé</th>
                        <th className="border p-2 text-right">Solde Impayé</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(customer => (
                        <tr key={customer.uuid}>
                            <td className="border p-2 font-medium">{customer.firstName} {customer.lastName}</td>
                            <td className="border p-2">{customer.phone || '-'}</td>
                            <td className="border p-2 text-right">{formatCurrency(customer.totalSpent)}</td>
                            <td className="border p-2 text-right font-bold">{formatCurrency(customer.outstandingBalance)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td className="border p-2 text-right" colSpan={3}>DETTE TOTALE DES CLIENTS LISTÉS</td>
                        <td className="border p-2 text-right text-base text-red-600">{formatCurrency(totalDebt)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <footer className="mt-12 pt-4 border-t text-center text-[10px] text-gray-500">
                <p>Logiciel de Gestion iPOS - Page 1 / 1</p>
            </footer>
        </div>
    );
});
PrintableList.displayName = 'PrintableList';

export function PrintCustomerListDialog({ customers, title = "Liste des Clients" }: PrintCustomerListDialogProps) {
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
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col print-dialog-content">
                    <DialogHeader className="print-hide">
                        <DialogTitle>Aperçu du Rapport Clients</DialogTitle>
                        <DialogDescription>Aperçu optimisé pour impression A4.</DialogDescription>
                    </DialogHeader>
                    <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-md">
                        <div id="label-print-area" className="bg-white mx-auto shadow-xl" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableList ref={printRef} customers={customers} profile={profile || null} title={title} />
                        </div>
                    </div>
                    <DialogFooter className="print-hide pt-4">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button>
                        <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Lancer l'impression</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

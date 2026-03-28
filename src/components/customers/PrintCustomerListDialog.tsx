
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
import { Printer, FileText, Users } from 'lucide-react';
import type { Customer, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

interface PrintCustomerListDialogProps {
    customers: Customer[];
}

const PrintableCustomerList = React.forwardRef<HTMLDivElement, { customers: Customer[], profile: CompanyProfile | null }>(({ customers, profile }, ref) => {
    const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
    
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans">
            <header className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'iPOS Terminal'}</h1>
                <h2 className="text-lg font-bold text-gray-600 mt-1">Registre des Comptes Clients & Encours de Dettes</h2>
                <p className="text-[10px] uppercase font-bold mt-2 opacity-60">Document Généré le {format(new Date(), 'Pp', { locale: fr })}</p>
            </header>

            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                        <th className="border p-3 text-left">Identité du Client</th>
                        <th className="border p-3 text-left">Contact / Catégorie</th>
                        <th className="border p-3 text-right">Dernier Achat</th>
                        <th className="border p-3 text-right font-black">Solde Dû (DA)</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map(c => (
                        <tr key={c.uuid} className="border-b border-gray-200">
                            <td className="border p-3 font-bold uppercase">{c.firstName} {c.lastName}</td>
                            <td className="border p-3">
                                <div className="flex flex-col">
                                    <span className="font-medium">{c.category}</span>
                                    <span className="text-[10px] opacity-70">{c.phone || 'Pas de tél.'}</span>
                                </div>
                            </td>
                            <td className="border p-3 text-right opacity-60">
                                {c.lastActivityDate ? format(new Date(c.lastActivityDate), 'dd/MM/yyyy') : '-'}
                            </td>
                            <td className={`border p-3 text-right font-black ${c.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {c.outstandingBalance.toFixed(1)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-black text-white font-black">
                        <td className="p-4 text-right" colSpan={3}>TOTAL ENCOURS CLIENTS</td>
                        <td className="p-4 text-right text-lg">{totalOutstanding.toLocaleString('fr-FR')} DA</td>
                    </tr>
                </tfoot>
            </table>

            <footer className="mt-12 flex justify-between items-end border-t pt-4">
                <div className="text-[8px] text-gray-400 italic">
                    iPOS Cloud Authority - Terminal de Gestion des Créances
                </div>
                <div className="text-center">
                    <div className="w-32 h-16 border border-dashed border-gray-300 mb-1 rounded flex items-center justify-center text-[8px] uppercase text-gray-300">Cachet & Signature</div>
                </div>
            </footer>
        </div>
    );
});
PrintableCustomerList.displayName = 'PrintableCustomerList';

export function PrintCustomerListDialog({ customers }: PrintCustomerListDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const profile = useAppStore((state) => state.profile);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const element = printRef.current;

        if (!printableContent || !element) return;

        const clone = element.cloneNode(true) as HTMLDivElement;
        clone.classList.add('a4-receipt');

        printableContent.innerHTML = '';
        printableContent.appendChild(clone);

        setTimeout(() => window.print(), 100);
    };

    return (
        <>
            <Button variant="outline" size="icon" onClick={() => setIsOpen(true)} className="h-11 w-11 luxury-glass border-primary/20 text-primary">
                <Printer className="h-4 w-4" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col print-dialog-content">
                    <DialogHeader className="print-hide">
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Aperçu du Registre Clientèle
                        </DialogTitle>
                        <DialogDescription>Format A4 optimisé pour le suivi des créances.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-3xl border border-white/5 shadow-inner">
                        <div className="bg-white mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableCustomerList ref={printRef} customers={customers} profile={profile || null} />
                        </div>
                    </div>
                    <DialogFooter className="print-hide pt-4 border-t border-white/5">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 px-8 rounded-xl font-bold gap-2">
                            <Printer className="h-4 w-4" /> Imprimer le Registre
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

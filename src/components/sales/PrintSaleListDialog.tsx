
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
import { Printer, FileText, History } from 'lucide-react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

interface PrintSaleListDialogProps {
    sales: Sale[];
}

const PrintableSaleList = React.forwardRef<HTMLDivElement, { sales: Sale[], profile: CompanyProfile | null }>(({ sales, profile }, ref) => {
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalCollected = sales.reduce((acc, s) => acc + s.amountPaid, 0);
    const totalDebt = sales.reduce((acc, s) => acc + s.remainingBalance, 0);
    
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans">
            <header className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'iPOS Terminal'}</h1>
                <h2 className="text-lg font-bold text-gray-600 mt-1">Grand Livre des Ventes & Flux de Trésorerie</h2>
                <p className="text-[10px] uppercase font-bold mt-2 opacity-60">Période d'Audit • Généré le {format(new Date(), 'Pp', { locale: fr })}</p>
            </header>

            <table className="w-full text-[10px] border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                        <th className="border p-2 text-left">Facture</th>
                        <th className="border p-2 text-left">Date & Heure</th>
                        <th className="border p-2 text-left">Statut</th>
                        <th className="border p-2 text-right">Total Net</th>
                        <th className="border p-2 text-right">Encaissé</th>
                        <th className="border p-2 text-right font-black">Reste à percevoir</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(s => (
                        <tr key={s.uuid} className="border-b border-gray-200">
                            <td className="border p-2 font-mono font-bold">#{s.invoiceNumber}</td>
                            <td className="border p-2">{format(new Date(s.createdAt), 'dd/MM/yy HH:mm')}</td>
                            <td className="border p-2 uppercase font-black text-[8px]">{s.paymentStatus}</td>
                            <td className="border p-2 text-right">{s.total.toFixed(1)}</td>
                            <td className="border p-2 text-right text-green-700">{s.amountPaid.toFixed(1)}</td>
                            <td className="border p-2 text-right font-black text-red-600">{s.remainingBalance.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-black">
                        <td className="p-2 text-right" colSpan={3}>RECAPITULATIF DES FLUX</td>
                        <td className="p-2 text-right">{totalRevenue.toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-right text-green-700">{totalCollected.toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-right text-red-600">{totalDebt.toLocaleString('fr-FR')}</td>
                    </tr>
                    <tr className="bg-black text-white font-black">
                        <td className="p-4 text-right" colSpan={5}>CHIFFRE D'AFFAIRES TOTAL NET</td>
                        <td className="p-4 text-right text-lg">{totalRevenue.toLocaleString('fr-FR')} DA</td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="p-4 border border-black rounded text-center">
                    <p className="text-[8px] font-black uppercase text-gray-500">Espèces Total</p>
                    <p className="text-sm font-bold">Calculé par Système</p>
                </div>
                <div className="p-4 border border-black rounded text-center">
                    <p className="text-[8px] font-black uppercase text-gray-500">Carte/Transfert</p>
                    <p className="text-sm font-bold">Calculé par Système</p>
                </div>
                <div className="p-4 border border-black rounded text-center">
                    <p className="text-[8px] font-black uppercase text-gray-500">Ventes à Crédit</p>
                    <p className="text-sm font-bold text-red-600">{totalDebt.toLocaleString('fr-FR')} DA</p>
                </div>
            </div>

            <footer className="mt-12 flex justify-between items-end border-t pt-4">
                <div className="text-[8px] text-gray-400 italic">
                    iPOS Cloud Authority - Intégrité du Grand Livre des Ventes
                </div>
                <div className="text-center">
                    <div className="w-32 h-16 border border-dashed border-gray-300 mb-1 rounded flex items-center justify-center text-[8px] uppercase text-gray-300">Visa de Direction</div>
                </div>
            </footer>
        </div>
    );
});
PrintableSaleList.displayName = 'PrintableSaleList';

export function PrintSaleListDialog({ sales }: PrintSaleListDialogProps) {
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
            <Button variant="outline" size="icon" onClick={() => setIsOpen(true)} className="h-12 w-12 luxury-glass border-primary/20 text-primary">
                <Printer className="h-4 w-4" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col print-dialog-content">
                    <DialogHeader className="print-hide">
                        <DialogTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Aperçu du Journal des Ventes
                        </DialogTitle>
                        <DialogDescription>Archive A4 optimisée pour le contrôle de gestion.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-3xl border border-white/5 shadow-inner">
                        <div className="bg-white mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableSaleList ref={printRef} sales={sales} profile={profile || null} />
                        </div>
                    </div>
                    <DialogFooter className="print-hide pt-4 border-t border-white/5">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
                        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 px-8 rounded-xl font-bold gap-2">
                            <Printer className="h-4 w-4" /> Imprimer le Journal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

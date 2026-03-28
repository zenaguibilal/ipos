
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
import { Printer, Archive } from 'lucide-react';
import type { StockIntake, Supplier, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

interface PrintStockListDialogProps {
    intakes: StockIntake[];
    supplierMap: Map<string, Supplier>;
}

const PrintableStockList = React.forwardRef<HTMLDivElement, { intakes: StockIntake[], supplierMap: Map<string, Supplier>, profile: CompanyProfile | null }>(({ intakes, supplierMap, profile }, ref) => {
    const totalMerchandise = intakes.reduce((acc, i) => acc + i.totalValue, 0);
    const totalTransport = intakes.reduce((acc, i) => acc + i.transportFees, 0);
    
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans">
            <header className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'iPOS Terminal'}</h1>
                <h2 className="text-lg font-bold text-gray-600 mt-1">Registre de Réception Marchandises & Coûts Logistiques</h2>
                <p className="text-[10px] uppercase font-bold mt-2 opacity-60">Document Généré le {format(new Date(), 'Pp', { locale: fr })}</p>
            </header>

            <table className="w-full text-[10px] border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                        <th className="border p-2 text-left">Réf. Facture</th>
                        <th className="border p-2 text-left">Date</th>
                        <th className="border p-2 text-left">Fournisseur</th>
                        <th className="border p-2 text-right">Articles</th>
                        <th className="border p-2 text-right">Transport</th>
                        <th className="border p-2 text-right font-black">Valeur Brute (DA)</th>
                    </tr>
                </thead>
                <tbody>
                    {intakes.map(i => (
                        <tr key={i.uuid} className="border-b border-gray-200">
                            <td className="border p-2 font-mono font-bold">#{i.invoiceNumber || 'SANS_REF'}</td>
                            <td className="border p-2">{format(new Date(i.invoiceDate), 'dd/MM/yyyy')}</td>
                            <td className="border p-2 uppercase font-bold">{i.supplierUuid ? supplierMap.get(i.supplierUuid)?.name : 'Inconnu'}</td>
                            <td className="border p-2 text-right">{i.items.length}</td>
                            <td className="border p-2 text-right">{i.transportFees.toFixed(1)}</td>
                            <td className="border p-2 text-right font-black">{i.totalValue.toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-black">
                        <td className="p-2 text-right" colSpan={4}>RECAPITULATIF LOGISTIQUE</td>
                        <td className="p-2 text-right text-orange-700">+{totalTransport.toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-right">{totalMerchandise.toLocaleString('fr-FR')}</td>
                    </tr>
                    <tr className="bg-black text-white font-black">
                        <td className="p-4 text-right" colSpan={5}>VALEUR TOTALE DES RÉCEPTIONS</td>
                        <td className="p-4 text-right text-lg">{(totalMerchandise + totalTransport).toLocaleString('fr-FR')} DA</td>
                    </tr>
                </tfoot>
            </table>

            <footer className="mt-12 flex justify-between items-end border-t pt-4">
                <div className="text-[8px] text-gray-400 italic">
                    iPOS Cloud Authority - Terminal de Gestion des Stocks
                </div>
                <div className="text-center">
                    <div className="w-32 h-16 border border-dashed border-gray-300 mb-1 rounded flex items-center justify-center text-[8px] uppercase text-gray-300">Cachet Réception</div>
                </div>
            </footer>
        </div>
    );
});
PrintableStockList.displayName = 'PrintableStockList';

export function PrintStockListDialog({ intakes, supplierMap }: PrintStockListDialogProps) {
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
                            <Archive className="h-5 w-5 text-primary" />
                            Aperçu du Registre de Tissage
                        </DialogTitle>
                        <DialogDescription>Format A4 optimisé pour l'inventaire و les coûts.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-3xl border border-white/5 shadow-inner">
                        <div className="bg-white mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableStockList ref={printRef} intakes={intakes} supplierMap={supplierMap} profile={profile || null} />
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

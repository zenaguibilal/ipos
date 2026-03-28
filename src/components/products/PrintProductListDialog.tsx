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
import { Printer, Package } from 'lucide-react';
import type { Product, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

/**
 * @fileOverview Product Inventory Printing (Sovereign Audit Edition)
 * نظام طباعة جرد المخزون: كشوفات احترافية لتدقيق الأصول المادية.
 */

interface PrintProductListDialogProps {
    products: Product[];
}

const PrintableProductList = React.forwardRef<HTMLDivElement, { products: Product[], profile: CompanyProfile | null }>(({ products, profile }, ref) => {
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.quantity * p.purchasePrice), 0);
    const totalSaleValue = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);
    
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans min-h-[297mm]">
            <header className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'iPOS Terminal'}</h1>
                <h2 className="text-lg font-bold text-gray-600 mt-1 italic">Inventaire du Stock & Valorisation des Actifs Circulants</h2>
                <p className="text-[10px] uppercase font-bold mt-2 opacity-60">Document d'Audit Généré le {format(new Date(), 'Pp', { locale: fr })}</p>
            </header>

            <table className="w-full text-[10px] border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-black">
                        <th className="border p-2 text-left">Désignation de l'Article</th>
                        <th className="border p-2 text-left">Rayon</th>
                        <th className="border p-2 text-center">Quantité</th>
                        <th className="border p-2 text-right">Achat U.</th>
                        <th className="border p-2 text-right">Vente U.</th>
                        <th className="border p-2 text-right font-black">Valeur Stock (Achat)</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p.uuid} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="border p-2 font-bold uppercase">{p.name}</td>
                            <td className="border p-2 text-[9px]">{p.category}</td>
                            <td className="border p-2 text-center font-mono font-bold">{p.quantity} {p.unite}</td>
                            <td className="border p-2 text-right">{p.purchasePrice.toFixed(1)}</td>
                            <td className="border p-2 text-right font-bold">{p.price.toFixed(1)}</td>
                            <td className="border p-2 text-right font-black">{(p.quantity * p.purchasePrice).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-50 font-bold border-t-2 border-black">
                        <td className="p-2 text-right" colSpan={5}>CUMUL VALEUR VÉNALE (VENTE)</td>
                        <td className="p-2 text-right">{totalSaleValue.toLocaleString('fr-FR')} DA</td>
                    </tr>
                    <tr className="bg-black text-white font-black">
                        <td className="p-4 text-right" colSpan={5}>VALORISATION TOTALE DE L'INVENTAIRE (ACHAT)</td>
                        <td className="p-4 text-right text-lg">{totalInventoryValue.toLocaleString('fr-FR')} DA</td>
                    </tr>
                </tfoot>
            </table>

            <div className="mt-12 grid grid-cols-2 gap-20">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-20 tracking-widest">Responsable de l'Inventaire</p>
                    <div className="border-t border-dashed border-gray-300 pt-2 text-[9px] uppercase font-bold text-gray-400">Signature و Nom</div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-20 tracking-widest">Visa de la Direction</p>
                    <div className="border-t border-dashed border-gray-300 pt-2 text-[9px] uppercase font-bold text-gray-400">Cachet de l'Établissement</div>
                </div>
            </div>

            <footer className="mt-auto pt-8 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 italic font-black uppercase tracking-widest">
                <p>iPOS Cloud Authority Core • Systèmes المحاسبية السيادية • © {new Date().getFullYear()}</p>
                <p>Page 1 / 1</p>
            </footer>
        </div>
    );
});
PrintableProductList.displayName = 'PrintableProductList';

export function PrintProductListDialog({ products }: PrintProductListDialogProps) {
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
            <Button variant="outline" size="icon" onClick={() => setIsOpen(true)} className="h-12 w-12 luxury-glass border-primary/20 text-primary shadow-xl hover:scale-105 active:scale-95 transition-all">
                <Printer className="h-4 w-4" />
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-5xl h-[90vh] flex flex-col print-dialog-content luxury-glass border-primary/20">
                    <DialogHeader className="print-hide p-6 bg-primary/5 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Audit de l'Inventaire</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Générez un état de stock valorisé pour l'archivage comptable.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto bg-muted/50 p-8 rounded-3xl border border-white/5 shadow-inner">
                        <div className="bg-white mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableProductList ref={printRef} products={products} profile={profile || null} />
                        </div>
                    </div>
                    <DialogFooter className="print-hide p-6 bg-white/5 border-t border-white/5 gap-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">Annuler</Button>
                        <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 px-10 rounded-xl shadow-2xl shadow-primary/30 font-black uppercase text-[10px] tracking-[0.2em] h-12 gap-3 group">
                            <Printer className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
                            Lancer l'Impression A4
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

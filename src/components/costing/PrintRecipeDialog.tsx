
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
import { Printer, Calculator, FileText, Scale, Percent, TrendingUp } from 'lucide-react';
import type { Recipe, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/lib/utils';

/**
 * @fileOverview Technical Recipe Printing (Sovereign Engineering Edition)
 * وثيقة رسمية للفنيات التقنية تشمل حسابات التكاليف والمكونات.
 */

interface PrintRecipeDialogProps {
    recipes: Recipe[];
}

const PrintableRecipeSheet = React.forwardRef<HTMLDivElement, { recipes: Recipe[], profile: CompanyProfile | null }>(({ recipes, profile }, ref) => {
    return (
        <div ref={ref} className="p-12 bg-white text-black font-sans min-h-[297mm]">
            <header className="text-center mb-10 border-b-2 border-black pb-6">
                <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'iPOS Terminal'}</h1>
                <h2 className="text-lg font-bold text-gray-600 mt-1 italic">Registre des Fiches Techniques & Ingénierie des Coûts</h2>
                <p className="text-[9px] uppercase font-bold mt-2 opacity-60">Audit Interne • Généré le {format(new Date(), 'Pp', { locale: fr })}</p>
            </header>

            <div className="space-y-12">
                {recipes.map((recipe, index) => (
                    <section key={recipe.uuid} className="space-y-6 break-inside-avoid">
                        <div className="flex justify-between items-end border-b border-gray-300 pb-2">
                            <div>
                                <h3 className="text-xl font-black uppercase text-gray-900">{index + 1}. {recipe.name}</h3>
                                <p className="text-xs text-gray-500 italic mt-1">{recipe.description || 'Aucune description technique.'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-gray-400">Rendement Lot</p>
                                <p className="text-lg font-black">{recipe.yieldQuantity} Unités</p>
                            </div>
                        </div>

                        <table className="w-full text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-y border-black">
                                    <th className="p-2 text-left">Matière Première / Ingrédient</th>
                                    <th className="p-2 text-center">Quantité</th>
                                    <th className="p-2 text-center">Unité</th>
                                    <th className="p-2 text-right">Coût U. (DA)</th>
                                    <th className="p-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipe.ingredients.map((ing, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="p-2 font-bold uppercase">{ing.name}</td>
                                        <td className="p-2 text-center">{ing.quantity}</td>
                                        <td className="p-2 text-center uppercase">{ing.unit}</td>
                                        <td className="p-2 text-right">{ing.unitCost.toFixed(1)}</td>
                                        <td className="p-2 text-right">{(ing.quantity * ing.unitCost).toFixed(1)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold">
                                    <td colSpan={4} className="p-2 text-right uppercase text-[9px]">Coût Total des Matières</td>
                                    <td className="p-2 text-right">{(recipe.unitCost * recipe.yieldQuantity).toFixed(1)}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 border-2 border-black rounded-xl text-center bg-gray-50">
                                <p className="text-[8px] font-black uppercase text-gray-500 mb-1">Prix de Revient /U</p>
                                <p className="text-xl font-black">{recipe.unitCost.toFixed(1)} DA</p>
                            </div>
                            <div className="p-4 border-2 border-black rounded-xl text-center bg-gray-50">
                                <p className="text-[8px] font-black uppercase text-gray-500 mb-1">Marge Cible</p>
                                <p className="text-xl font-black">{recipe.targetMargin}%</p>
                            </div>
                            <div className="p-4 border-2 border-black rounded-xl text-center bg-black text-white">
                                <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Prix de Vente Suggéré</p>
                                <p className="text-xl font-black">{recipe.suggestedPrice.toFixed(1)} DA</p>
                            </div>
                        </div>
                    </section>
                ))}
            </div>

            <footer className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center text-[8px] text-gray-400 italic font-black uppercase tracking-widest">
                <p>iPOS Technical Services • © {new Date().getFullYear()}</p>
                <p>Visa de la Direction _______________________</p>
            </footer>
        </div>
    );
});
PrintableRecipeSheet.displayName = 'PrintableRecipeSheet';

export function PrintRecipeDialog({ recipes }: PrintRecipeDialogProps) {
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
                                <Calculator className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Impression des Fiches Techniques</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Générez des documents A4 pour vos dossiers de fabrication و calcul de marges.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto bg-muted/50 p-8 rounded-3xl border border-white/5 shadow-inner">
                        <div className="bg-white mx-auto shadow-2xl" style={{ width: '210mm', minHeight: '297mm' }}>
                            <PrintableRecipeSheet ref={printRef} recipes={recipes} profile={profile || null} />
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

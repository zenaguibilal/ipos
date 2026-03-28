
'use client';

import React from 'react';
import type { CompanyProfile } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ZakatReportProps {
  calculation: any;
  profile: CompanyProfile | null;
}

export const ZakatReport = React.forwardRef<HTMLDivElement, ZakatReportProps>(({ calculation, profile }, ref) => {
    return (
        <div ref={ref} className="p-12 bg-white text-black font-sans min-h-[297mm] w-full">
            {/* Header */}
            <header className="flex justify-between items-start pb-8 border-b-2 border-black mb-10">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'Mon Magasin'}</h1>
                    <p className="text-sm mt-1">{profile?.address}</p>
                    <p className="text-sm">{profile?.city}, {profile?.country}</p>
                    <p className="text-sm">Tél: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <div className="px-6 py-3 bg-black text-white text-xl font-black uppercase tracking-[0.2em] mb-3">
                        Rapport de Zakat
                    </div>
                    <p className="text-xs font-bold">Document Officiel • iPOS Sovereign</p>
                    <p className="text-xs">Date: {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Assessment Certificate Title */}
            <div className="text-center mb-12">
                <h2 className="text-3xl font-black uppercase tracking-widest border-b-2 border-black inline-block pb-2">Certificat d'Évaluation</h2>
                <p className="text-sm italic text-gray-600 mt-4 max-w-2xl mx-auto">
                    Attestation de calcul de l'assiette zakátique sur la base des actifs circulants و des dettes exigibles de l'exercice commercial en cours.
                </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-10 mb-12">
                <div className="p-8 border-2 border-black rounded-3xl bg-gray-50 flex flex-col justify-center items-center text-center">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">ASSIETTE NETTE IMPOSABLE</h3>
                    <p className="text-4xl font-black">{formatCurrency(calculation.zakatBase)}</p>
                </div>
                <div className="p-8 border-2 border-black rounded-3xl bg-black text-white flex flex-col justify-center items-center text-center">
                    <h3 className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest text-primary">ZAKAT DUE (2.5%)</h3>
                    <p className="text-4xl font-black text-primary">{formatCurrency(calculation.zakatAmount)}</p>
                </div>
            </div>

            {/* Breakdown Table */}
            <section className="mb-12">
                <h3 className="text-xs font-black uppercase mb-4 border-b-2 border-gray-200 pb-2 tracking-[0.2em]">Détails du Patrimoine Commercial</h3>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {/* Actifs */}
                        <tr className="bg-gray-100"><td colSpan={2} className="p-3 font-black text-[10px] uppercase">ACTIFS CIRCULANTS (ÉLÉMENTS POSITIFS)</td></tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-4">Valeur vénale des stocks (Marchandises)</td>
                            <td className="p-4 text-right font-bold">{formatCurrency(calculation.inventoryValue)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-4">Liquidités disponibles (Caisse et Banque)</td>
                            <td className="p-4 text-right font-bold">{formatCurrency(calculation.cashOnHand)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-4">Créances clients recouvrables</td>
                            <td className="p-4 text-right font-bold">{formatCurrency(calculation.customerDebts)}</td>
                        </tr>
                        
                        {/* Passifs */}
                        <tr className="bg-gray-100"><td colSpan={2} className="p-3 font-black text-[10px] uppercase mt-4">PASSIFS EXIGIBLES (ÉLÉMENTS DÉDUCTIBLES)</td></tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-4">Dettes fournisseurs</td>
                            <td className="p-4 text-right font-bold text-red-600">-{formatCurrency(calculation.supplierDebts)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-4">Autres dettes et charges opérationnelles</td>
                            <td className="p-4 text-right font-bold text-red-600">-{formatCurrency(calculation.otherDebts)}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Reference Data */}
            <section className="p-6 border border-dashed border-gray-300 rounded-2xl bg-gray-50 flex justify-between items-center mb-16">
                <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Référence Marché</p>
                    <p className="text-sm font-bold">Prix de l'Or (Gramme 24k): <span className="font-black">{formatCurrency(calculation.goldPrice)}</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1 tracking-widest">Nisab Calculé</p>
                    <p className="text-sm font-black">{formatCurrency(calculation.nisab)}</p>
                </div>
            </section>

            {/* Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-20">
                <div className="text-center w-64 mx-auto">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-16">Audit Interne iPOS</p>
                    <div className="border-t border-dashed border-gray-300 pt-2">Vérifié و Certifié</div>
                </div>
                <div className="text-center w-64 mx-auto">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-16">Cachet de l'Établissement</p>
                    <div className="border-t border-dashed border-gray-300 pt-2">{profile?.companyName}</div>
                </div>
            </div>

            <footer className="absolute bottom-12 left-12 right-12 text-center text-[8px] text-gray-400 italic border-t border-gray-100 pt-4">
                <p>iPOS Cloud Authority • Ce document est généré par un système déterministe pour assister le gestionnaire dans son évaluation de la Zakat.</p>
            </footer>
        </div>
    );
});
ZakatReport.displayName = 'ZakatReport';

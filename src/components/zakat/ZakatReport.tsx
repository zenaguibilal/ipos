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

/**
 * @fileOverview Official Zakat Assessment Certificate (A4 Optimized)
 * وثيقة رسمية تحمل الطابع السيادي والمهني لتقييم الزكاة للمنشأة.
 */
export const ZakatReport = React.forwardRef<HTMLDivElement, ZakatReportProps>(({ calculation, profile }, ref) => {
    return (
        <div ref={ref} className="p-16 bg-white text-black font-sans min-h-[297mm] w-full relative overflow-hidden">
            {/* Elegant Border Decoration */}
            <div className="absolute top-0 left-0 w-full h-4 bg-black" />
            <div className="absolute bottom-0 left-0 w-full h-4 bg-black" />
            
            {/* Header */}
            <header className="flex justify-between items-start pb-8 border-b-2 border-black mb-12">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">{profile?.companyName || 'Mon Magasin'}</h1>
                    <p className="text-xs mt-1 uppercase font-bold opacity-60 tracking-widest">iPOS Cloud Authority Instance</p>
                    <div className="mt-4 space-y-0.5 text-xs">
                        <p>{profile?.address}</p>
                        <p>{profile?.city}, {profile?.country}</p>
                        <p>Tél: {profile?.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-6 py-3 bg-black text-white text-xl font-black uppercase tracking-[0.2em] mb-3">
                        Rapport de Zakat
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Document Certifié • SOVEREIGN_ID: {calculation.uuid?.substring(0,8) || 'LIVE'}</p>
                    <p className="text-xs font-bold mt-1">Date d'émission: {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Assessment Certificate Title */}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black uppercase tracking-[0.3em] border-b-4 border-black inline-block pb-3 mb-6 italic">Certificat d'Évaluation</h2>
                <p className="text-sm italic text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Attestation déterministe de calcul de l'assiette zakátique établie sur la base des actifs circulants و des passifs exigibles identifiés par le terminal iPOS.
                </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-12 mb-16">
                <div className="p-10 border-4 border-black rounded-[2.5rem] bg-gray-50 flex flex-col justify-center items-center text-center shadow-xl">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 mb-3 tracking-[0.3em]">ASSIETTE NETTE IMPOSABLE</h3>
                    <p className="text-5xl font-black tracking-tighter">{formatCurrency(calculation.zakatBase)}</p>
                </div>
                <div className="p-10 border-4 border-black rounded-[2.5rem] bg-black text-white flex flex-col justify-center items-center text-center shadow-xl">
                    <h3 className="text-[10px] font-black uppercase opacity-60 mb-3 tracking-[0.3em] text-yellow-500">ZAKAT DUE (2.5%)</h3>
                    <p className="text-5xl font-black text-yellow-500 tracking-tighter">{formatCurrency(calculation.zakatAmount)}</p>
                </div>
            </div>

            {/* Breakdown Table */}
            <section className="mb-16">
                <h3 className="text-[11px] font-black uppercase mb-6 border-b-2 border-gray-200 pb-3 tracking-[0.4em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-black" />
                    Inventaire du Patrimoine Commercial
                </h3>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {/* Actifs */}
                        <tr className="bg-gray-100"><td colSpan={2} className="p-4 font-black text-[10px] uppercase tracking-widest border-y border-black/10">ACTIFS CIRCULANTS (VALEURS POSITIVES)</td></tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-5">Valeur vénale des stocks (Marchandises au prix d'achat)</td>
                            <td className="p-5 text-right font-black text-lg">{formatCurrency(calculation.inventoryValue)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-5">Liquidités disponibles (Caisse, Banque و coffre)</td>
                            <td className="p-5 text-right font-black text-lg">{formatCurrency(calculation.cashOnHand)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-5">Créances clients recouvrables (Dettes actives)</td>
                            <td className="p-5 text-right font-black text-lg">{formatCurrency(calculation.customerDebts)}</td>
                        </tr>
                        
                        {/* Passifs */}
                        <tr className="bg-gray-50"><td colSpan={2} className="p-4 font-black text-[10px] uppercase tracking-widest border-y border-black/10 mt-6">PASSIFS EXIGIBLES (DÉDUCTIONS LÉGALES)</td></tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-5">Dettes fournisseurs échues</td>
                            <td className="p-5 text-right font-black text-lg text-red-600">-{formatCurrency(calculation.supplierDebts)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                            <td className="p-5">Autres charges opérationnelles و dettes de fonctionnement</td>
                            <td className="p-5 text-right font-black text-lg text-red-600">-{formatCurrency(calculation.otherDebts)}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Reference Data */}
            <section className="p-8 border-2 border-dashed border-gray-300 rounded-[2rem] bg-gray-50 flex justify-between items-center mb-20">
                <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-[0.2em]">PARAMÈTRE DE RÉFÉRENCE MARCHÉ</p>
                    <p className="text-lg font-bold">Valeur Or (24k) : <span className="font-black underline decoration-2">{formatCurrency(calculation.goldPrice)} /gramme</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-[0.2em]">NISAB CALCULÉ (85g)</p>
                    <p className="text-2xl font-black">{formatCurrency(calculation.nisab)}</p>
                </div>
            </section>

            {/* Signatures */}
            <div className="mt-auto grid grid-cols-2 gap-24 pt-12">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-20 tracking-widest">Audit Interne iPOS Authority</p>
                    <div className="border-t-2 border-black pt-3 font-black uppercase text-xs">VÉRIFIÉ و CERTIFIÉ</div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-20 tracking-widest">Direction de l'Établissement</p>
                    <div className="border-t-2 border-black pt-3 font-black uppercase text-xs">{profile?.companyName}</div>
                </div>
            </div>

            {/* Footer */}
            <footer className="absolute bottom-12 left-16 right-16 text-center text-[8px] text-gray-400 italic border-t border-gray-100 pt-6 uppercase font-black tracking-widest">
                <p>iPOS Cloud Authority Core • Ce document est généré par un système déterministe حتمي • © {new Date().getFullYear()} All Rights Reserved.</p>
            </footer>
        </div>
    );
});
ZakatReport.displayName = 'ZakatReport';


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
            {/* Elegant Decoration */}
            <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-900" />
            <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-r from-emerald-900 via-emerald-600 to-emerald-900" />
            
            {/* Header */}
            <header className="flex justify-between items-start pb-8 border-b-4 border-emerald-900 mb-12">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">{profile?.companyName || 'Mon Magasin'}</h1>
                    <p className="text-[10px] mt-1 uppercase font-black text-emerald-800 tracking-[0.3em]">iPOS Cloud Authority Instance</p>
                    <div className="mt-6 space-y-1 text-xs font-bold text-gray-600">
                        <p>{profile?.address}</p>
                        <p>{profile?.city}, {profile?.country}</p>
                        <p>Tél: {profile?.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="px-8 py-4 bg-emerald-900 text-white text-xl font-black uppercase tracking-[0.3em] mb-4 shadow-xl">
                        Rapport de Zakat
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-900">Document Certifié • SOVEREIGN_ID: {calculation.uuid?.substring(0,8) || 'LIVE_CALC'}</p>
                    <p className="text-xs font-bold mt-1">Date d'émission: {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Assessment Certificate Title */}
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black uppercase tracking-[0.4em] border-b-4 border-emerald-900 inline-block pb-4 mb-8 italic">Certificat d'Évaluation</h2>
                <p className="text-sm italic text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
                    Attestation déterministe de calcul de l'assiette zakátique établie sur la base des actifs circulants و des passifs exigibles identifiés par le terminal souverain iPOS.
                </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-12 mb-16">
                <div className="p-10 border-4 border-emerald-900 rounded-[3rem] bg-gray-50 flex flex-col justify-center items-center text-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                    </div>
                    <h3 className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-[0.4em]">ASSIETTE NETTE IMPOSABLE</h3>
                    <p className="text-5xl font-black tracking-tighter text-gray-900">{formatCurrency(calculation.zakatBase)}</p>
                </div>
                <div className="p-10 border-4 border-emerald-900 rounded-[3rem] bg-emerald-900 text-white flex flex-col justify-center items-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-800/20" />
                    <h3 className="text-[10px] font-black uppercase text-emerald-400 mb-4 tracking-[0.4em] relative z-10">ZAKAT DUE (2.5%)</h3>
                    <p className="text-5xl font-black text-white tracking-tighter relative z-10">{formatCurrency(calculation.zakatAmount)}</p>
                </div>
            </div>

            {/* Breakdown Table */}
            <section className="mb-16">
                <h3 className="text-[11px] font-black uppercase mb-6 border-b-2 border-emerald-900/20 pb-3 tracking-[0.5em] flex items-center gap-3 text-emerald-900">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-900" />
                    Inventaire du Patrimoine Commercial
                </h3>
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {/* Actifs */}
                        <tr className="bg-emerald-50"><td colSpan={2} className="p-4 font-black text-[10px] uppercase tracking-widest border-y border-emerald-900/10 text-emerald-900">ACTIFS CIRCULANTS (VALEURS POSITIVES)</td></tr>
                        <tr className="border-b border-gray-100">
                            <td className="p-5 font-bold text-gray-700">Valeur vénale des stocks (Marchandises au prix d'achat)</td>
                            <td className="p-5 text-right font-black text-lg">{formatCurrency(calculation.inventoryValue)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="p-5 font-bold text-gray-700">Liquidités disponibles (Caisse, Banque و coffre)</td>
                            <td className="p-5 text-right font-black text-lg">{formatCurrency(calculation.cashOnHand)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="p-5 font-bold text-gray-700">Créances clients recouvrables (Dettes actives)</td>
                            <td className="p-5 text-right font-black text-lg text-emerald-600">{formatCurrency(calculation.customerDebts)}</td>
                        </tr>
                        
                        {/* Passifs */}
                        <tr className="bg-gray-50"><td colSpan={2} className="p-4 font-black text-[10px] uppercase tracking-widest border-y border-emerald-900/10 mt-6 text-red-900">PASSIFS EXIGIBLES (DÉDUCTIONS LÉGALES)</td></tr>
                        <tr className="border-b border-gray-100">
                            <td className="p-5 font-bold text-gray-700">Dettes fournisseurs échues</td>
                            <td className="p-5 text-right font-black text-lg text-red-600">-{formatCurrency(calculation.supplierDebts)}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                            <td className="p-5 font-bold text-gray-700">Autres charges opérationnelles و dettes de fonctionnement</td>
                            <td className="p-5 text-right font-black text-lg text-red-600">-{formatCurrency(calculation.otherDebts)}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Reference Data */}
            <section className="p-8 border-4 border-double border-emerald-900 rounded-[2.5rem] bg-emerald-50/30 flex justify-between items-center mb-20">
                <div>
                    <p className="text-[10px] font-black uppercase text-emerald-800 mb-2 tracking-[0.3em]">PARAMÈTRE DE RÉFÉRENCE MARCHÉ</p>
                    <p className="text-xl font-black">Valeur Or (24k) : <span className="underline decoration-2 text-emerald-900">{formatCurrency(calculation.goldPrice)} /gramme</span></p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-emerald-800 mb-2 tracking-[0.3em]">NISAB CALCULÉ (85g)</p>
                    <p className="text-3xl font-black text-emerald-900">{formatCurrency(calculation.nisab)}</p>
                </div>
            </section>

            {/* Signatures */}
            <div className="mt-auto grid grid-cols-2 gap-24 pt-12">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-24 tracking-[0.3em]">Audit Interne iPOS Authority</p>
                    <div className="border-t-4 border-emerald-900 pt-4 font-black uppercase text-xs text-emerald-900">VÉRIFIÉ و CERTIFIÉ PAR SYSTÈME</div>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-24 tracking-[0.3em]">Direction de l'Établissement</p>
                    <div className="border-t-4 border-emerald-900 pt-4 font-black uppercase text-xs text-emerald-900">{profile?.companyName}</div>
                </div>
            </div>

            {/* Footer */}
            <footer className="absolute bottom-12 left-16 right-16 text-center text-[8px] text-emerald-900/40 italic border-t border-gray-100 pt-6 uppercase font-black tracking-[0.5em]">
                <p>iPOS Cloud Authority Core • Ce document est généré par un système déterministe حتمي • © {new Date().getFullYear()} All Rights Reserved.</p>
            </footer>
        </div>
    );
});
ZakatReport.displayName = 'ZakatReport';

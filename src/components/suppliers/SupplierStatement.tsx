
'use client';

import React from 'react';
import type { Supplier, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate } from '@/lib/utils';

interface SupplierStatementProps {
  supplier: Supplier;
  activity: any[];
  profile: CompanyProfile | null;
}

export const SupplierStatement = React.forwardRef<HTMLDivElement, SupplierStatementProps>(({ supplier, activity, profile }, ref) => {
    return (
        <div ref={ref} className="p-8 bg-white text-black font-sans min-h-[297mm]">
            {/* Header */}
            <header className="flex justify-between items-start pb-6 border-b-2 border-black">
                <div>
                    <h1 className="text-2xl font-bold uppercase">{profile?.companyName || 'Mon Magasin'}</h1>
                    <p className="text-sm">{profile?.address}</p>
                    <p className="text-sm">{profile?.city}, {profile?.country}</p>
                    <p className="text-sm">Tél: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-black uppercase text-gray-800">Relevé Fournisseur</h2>
                    <p className="text-sm font-bold">Généré le: {format(new Date(), 'd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Supplier Info */}
            <section className="my-8 grid grid-cols-2 gap-8">
                <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 mb-2">Partenaire</h3>
                    <p className="font-bold text-xl">{supplier.name}</p>
                    {supplier.contactPerson && <p className="text-sm">Contact: {supplier.contactPerson}</p>}
                    {supplier.phone && <p className="text-sm">Tél: {supplier.phone}</p>}
                    {supplier.address && <p className="text-xs italic mt-1">{supplier.address}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg flex flex-col justify-center items-center text-center">
                    <h3 className="text-[10px] font-black uppercase text-gray-500 mb-1">Solde Dû Actuel</h3>
                    <p className="text-3xl font-black text-red-600">{formatCurrency(supplier.balance)}</p>
                </div>
            </section>

            {/* Activity Table */}
            <section className="my-6">
                <h3 className="text-sm font-black uppercase mb-4 border-b pb-1">Historique des Opérations (Derniers mouvements)</h3>
                <table className="w-full text-xs border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="text-left p-3">Date</th>
                            <th className="text-left p-3">Type</th>
                            <th className="text-left p-3">Référence</th>
                            <th className="text-right p-3">Débit (Achat)</th>
                            <th className="text-right p-3">Crédit (Paiement)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activity.slice(0, 30).map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3">{format(safeToDate(item.date), 'dd/MM/yyyy')}</td>
                                <td className="p-3 font-bold uppercase text-[9px]">
                                    {item.type === 'intake' ? '📦 Réception' : '💵 Paiement'}
                                </td>
                                <td className="p-3 font-mono">
                                    {item.type === 'intake' ? (item.invoiceNumber || 'N/A') : `PAY-${item.uuid.substring(0,5).toUpperCase()}`}
                                </td>
                                <td className="p-3 text-right font-semibold">
                                    {item.type === 'intake' ? formatCurrency(item.totalValue) : '-'}
                                </td>
                                <td className="p-3 text-right font-semibold text-green-600">
                                    {item.type === 'payment' ? formatCurrency(item.amount) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {activity.length === 0 && (
                    <p className="text-center py-8 text-gray-400 italic">Aucun mouvement enregistré pour ce fournisseur.</p>
                )}
            </section>

            {/* Summary Footer */}
            <section className="mt-12 p-6 bg-gray-900 text-white rounded-2xl flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase opacity-60">Total des achats enregistrés</p>
                    <p className="text-xl font-bold">{formatCurrency(activity.filter(a => a.type === 'intake').reduce((sum, i) => sum + i.totalValue, 0))}</p>
                </div>
                <div className="h-10 w-px bg-white/20 mx-4" />
                <div>
                    <p className="text-[10px] font-black uppercase opacity-60">Total des paiements versés</p>
                    <p className="text-xl font-bold">{formatCurrency(activity.filter(a => a.type === 'payment').reduce((sum, p) => sum + p.amount, 0))}</p>
                </div>
                <div className="h-10 w-px bg-white/20 mx-4" />
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-red-400">Reste à solder</p>
                    <p className="text-3xl font-black">{formatCurrency(supplier.balance)}</p>
                </div>
            </section>

            {/* Signature Area */}
            <div className="mt-20 grid grid-cols-2 gap-20">
                <div className="border-t pt-2 text-center text-[10px] text-gray-400 uppercase font-black">Signature Fournisseur</div>
                <div className="border-t pt-2 text-center text-[10px] text-gray-400 uppercase font-black">Cachet Etablissement</div>
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-center text-[8px] text-gray-400 italic border-t pt-2">
                <p>iPOS - Logiciel de Gestion de Point de Vente et Stock • Page 1/1</p>
            </footer>
        </div>
    );
});
SupplierStatement.displayName = 'SupplierStatement';

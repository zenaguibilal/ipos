
'use client';

import React from 'react';
import type { ProductReturn, CompanyProfile } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReturnReceiptProps {
  productReturn: ProductReturn;
  profile: CompanyProfile | null;
}

export const ReturnReceipt = React.forwardRef<HTMLDivElement, ReturnReceiptProps>(({ productReturn, profile }, ref) => {
    const impactDebt = productReturn.totalReturnValue - productReturn.amountRefunded;

    return (
        <div ref={ref} className="p-8 w-full text-black bg-white font-sans a4-receipt-container">
            {/* Elegant Header for A4 */}
            <header className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.companyName || 'Mon Magasin'}</h1>
                    <p className="text-xs">{profile?.address}</p>
                    <p className="text-xs">{profile?.city}, {profile?.country}</p>
                    <p className="text-xs">Tél: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <div className="px-4 py-2 bg-black text-white text-lg font-black uppercase tracking-[0.2em] mb-2">
                        Bon de Retour
                    </div>
                    <p className="text-xs font-bold">N° RET-{productReturn.uuid.substring(0, 8).toUpperCase()}</p>
                    <p className="text-xs">Date: {format(safeToDate(productReturn.createdAt!), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
            </header>

            <section className="mb-8 p-4 border border-gray-200 bg-gray-50 rounded-xl">
                <h3 className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Informations Source</h3>
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                        <p className="font-medium text-gray-600">Facture d'Origine :</p>
                        <p className="font-black text-lg">#{productReturn.originalInvoiceNumber}</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-600">Client :</p>
                        <p className="font-black text-lg uppercase">{productReturn.customerUuid ? 'Compte Client iPOS' : 'Client de passage'}</p>
                    </div>
                </div>
            </section>

            <table className="w-full text-sm mb-8 border-collapse">
                <thead>
                    <tr className="bg-gray-100 border-t-2 border-b-2 border-black">
                        <th className="text-left p-3 font-black uppercase">Désignation</th>
                        <th className="text-center p-3 font-black uppercase">Qté</th>
                        <th className="text-right p-3 font-black uppercase">Prix U.</th>
                        <th className="text-center p-3 font-black uppercase">Action Stock</th>
                        <th className="text-right p-3 font-black uppercase">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {productReturn.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                            <td className="p-3 font-bold uppercase text-xs">{item.productName}</td>
                            <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                            <td className="p-3 text-right">{item.price.toFixed(1)}</td>
                            <td className="p-3 text-center">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${item.wasRestocked ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {item.wasRestocked ? 'Re-stock' : 'Telf/Perte'}
                                </span>
                            </td>
                            <td className="p-3 text-right font-bold">{(item.price * item.quantity).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mb-12">
                <div className="w-80 space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between font-bold text-gray-600 text-xs">
                        <span>VALEUR DES ARTICLES :</span>
                        <span>{formatCurrency(productReturn.totalReturnValue)}</span>
                    </div>
                    <div className="flex justify-between text-blue-600 text-xs">
                        <span className="font-bold">REMBOURSÉ CASH :</span>
                        <span className="font-black">- {formatCurrency(productReturn.amountRefunded)}</span>
                    </div>
                    <div className="h-px bg-gray-300 my-2" />
                    <div className="flex justify-between font-black text-lg text-red-600">
                        <span>CRÉDITÉ AU COMPTE :</span>
                        <span>{formatCurrency(impactDebt)}</span>
                    </div>
                </div>
            </div>

            {productReturn.notes && (
                <div className="mb-12 p-4 bg-gray-100 text-xs italic border-l-4 border-black rounded shadow-inner">
                    <span className="font-black uppercase text-[10px] block mb-1 not-italic">Motif de la régularisation :</span>
                    "{productReturn.notes}"
                </div>
            )}

            <footer className="mt-auto pt-12 border-t border-gray-200">
                <div className="flex justify-between text-[10px] uppercase font-black text-gray-400 mb-12">
                    <div className="text-center w-48">
                        <p className="mb-16">Signature Client</p>
                        <div className="border-t border-dashed border-gray-300 pt-2">Lu و approuvé</div>
                    </div>
                    <div className="text-center w-48">
                        <p className="mb-16">Cachet Établissement</p>
                        <div className="border-t border-dashed border-gray-300 pt-2">iPOS Authority</div>
                    </div>
                </div>
                <p className="text-center text-[8px] text-gray-400 italic">
                    Document généré par iPOS Cloud Authority • Ce document fait foi de régularisation comptable et de mise à jour de l'inventaire.
                </p>
            </footer>
        </div>
    );
});
ReturnReceipt.displayName = 'ReturnReceipt';


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
        <div ref={ref} className="p-4 w-full text-black bg-white font-sans">
            <header className="text-center mb-4 border-b-2 border-black pb-2">
                <h1 className="text-xl font-bold uppercase">{profile?.companyName || 'Mon Magasin'}</h1>
                {profile?.address && <p className="text-[10px]">{profile.address}, {profile.city}</p>}
                {profile?.phone && <p className="text-[10px]">Tél: {profile.phone}</p>}
                <div className="mt-2 py-1 bg-black text-white text-sm font-bold uppercase tracking-widest">
                    Bon de Retour
                </div>
            </header>

            <div className="text-[10px] space-y-1 mb-4">
                <p className="flex justify-between"><span>Référence Retour:</span> <strong>#{productReturn.uuid.substring(0, 8).toUpperCase()}</strong></p>
                <p className="flex justify-between"><span>Facture Originale:</span> <strong>#{productReturn.originalInvoiceNumber}</strong></p>
                <p className="flex justify-between"><span>Date:</span> {format(safeToDate(productReturn.createdAt!), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
            </div>

            <table className="w-full text-[10px] mb-4">
                <thead>
                    <tr className="border-t border-b border-black font-bold">
                        <th className="text-left py-1">Article</th>
                        <th className="text-center py-1">Qté</th>
                        <th className="text-right py-1">Prix U.</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {productReturn.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                            <td className="py-1">{item.productName}</td>
                            <td className="text-center py-1">{item.quantity}</td>
                            <td className="text-right py-1">{item.price.toFixed(1)}</td>
                            <td className="text-right py-1">{(item.price * item.quantity).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="space-y-1 border-t-2 border-black pt-2 text-[10px]">
                <div className="flex justify-between font-bold text-xs">
                    <span>VALEUR DES ARTICLES:</span>
                    <span>{formatCurrency(productReturn.totalReturnValue)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Montant remboursé (Espèces):</span>
                    <span>- {formatCurrency(productReturn.amountRefunded)}</span>
                </div>
                {impactDebt > 0.01 && (
                    <div className="flex justify-between font-bold border-t border-dashed pt-1 mt-1">
                        <span>CRÉDITÉ AU COMPTE CLIENT:</span>
                        <span>{formatCurrency(impactDebt)}</span>
                    </div>
                )}
            </div>

            {productReturn.notes && (
                <div className="mt-4 p-2 bg-gray-100 text-[9px] italic border rounded border-gray-300">
                    <strong>Motif :</strong> {productReturn.notes}
                </div>
            )}

            <footer className="text-center mt-8 text-[9px] text-gray-500 border-t border-gray-300 pt-2">
                <p>Document généré par iPOS - Merci de votre visite.</p>
                <div className="mt-4 flex justify-between px-4">
                    <span>Signature Client</span>
                    <span>Signature Magasin</span>
                </div>
                <div className="h-12"></div>
            </footer>
        </div>
    );
});
ReturnReceipt.displayName = 'ReturnReceipt';

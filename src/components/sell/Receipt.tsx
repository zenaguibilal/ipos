
'use client';

import React, { useState, useEffect } from 'react';
import type { CompanyProfile, Sale } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import QRCode from 'qrcode';

interface ReceiptProps {
  sale: Sale & { change?: number };
  profile: CompanyProfile | null;
}

const paymentMethodLabels = {
    cash: 'Espèces',
    card: 'Carte Bancaire',
    other: 'Autre'
};

const getReceiptInfo = (companyProfile?: CompanyProfile) => ({
    title: "REÇU DE VENTE",
    shopName: companyProfile?.companyName || "iPOS Store",
    address: companyProfile?.address,
    city: [companyProfile?.zipCode, companyProfile?.city].filter(Boolean).join(' '),
    phone: companyProfile?.phone ? `Tél: ${companyProfile.phone}` : undefined,
    rc: companyProfile?.rcNumber ? `RC: ${companyProfile.rcNumber}` : undefined,
    nif: companyProfile?.vatNumber ? `NIF: ${companyProfile.vatNumber}` : undefined,
    invoiceLabel: "Facture N°:",
    dateLabel: "Date:",
    customerLabel: "Client:",
    itemHeader: "Article",
    qtyHeader: "Qté",
    priceHeader: "Prix",
    totalHeader: "Total",
    subtotalLabel: "Sous-total:",
    discountLabel: "Remise",
    totalLabel: "TOTAL:",
    paymentMethodLabel: "Méthode de paiement:",
    amountPaidLabel: "Montant Payé:",
    changeLabel: "Monnaie Rendue:",
    creditLabel: "Solde Restant (Crédit):",
    thankYou: "Merci de votre visite !",
});

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, profile }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    
    const receiptInfo = getReceiptInfo(profile ?? undefined);

    useEffect(() => {
        if (!sale?.createdAt) return;
        const details = [
            `Facture: ${sale.invoiceNumber}`,
            `Date: ${format(new Date(sale.createdAt), 'Pp', { locale: fr })}`,
            `Total: ${formatCurrency(sale.total)}`
        ].join('\n');
        
        QRCode.toDataURL(details, { errorCorrectionLevel: 'M', width: 100 })
            .then(url => setQrCodeUrl(url))
            .catch(err => {});

    }, [sale]);
    
    if (!sale?.createdAt) {
        return <div ref={ref}>Génération du reçu...</div>;
    }

    return (
        <div ref={ref} className="p-4 bg-white text-black text-sm font-mono">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold">{receiptInfo.shopName}</h2>
                {receiptInfo.address && <p>{receiptInfo.address}</p>}
                {receiptInfo.city && <p>{receiptInfo.city}</p>}
                {receiptInfo.phone && <p>{receiptInfo.phone}</p>}
                <div className="flex justify-center gap-4 text-xs">
                    {receiptInfo.rc && <p>{receiptInfo.rc}</p>}
                    {receiptInfo.nif && <p>{receiptInfo.nif}</p>}
                </div>
            </div>

            <div className="border-t border-b border-dashed border-black my-2 py-2">
                <div className="flex justify-between">
                    <span>{receiptInfo.invoiceLabel}</span>
                    <span>{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>{receiptInfo.dateLabel}</span>
                    <span>{format(new Date(sale.createdAt), 'Pp', { locale: fr })}</span>
                </div>
                 {sale.customerName && (
                    <div className="flex justify-between">
                        <span>{receiptInfo.customerLabel}</span>
                        <span>{sale.customerName}</span>
                    </div>
                )}
            </div>

            <table className="w-full my-2">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left font-bold">{receiptInfo.itemHeader}</th>
                        <th className="text-center font-bold">{receiptInfo.qtyHeader}</th>
                        <th className="text-right font-bold">{receiptInfo.priceHeader}</th>
                        <th className="text-right font-bold">{receiptInfo.totalHeader}</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1">{item.name}</td>
                            <td className="text-center py-1">{item.quantity}</td>
                            <td className="text-right py-1">{item.price.toFixed(1)}</td>
                            <td className="text-right py-1">{(item.price * item.quantity).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-dashed border-black mt-2 pt-2">
                <div className="flex justify-between">
                    <span>{receiptInfo.subtotalLabel}</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discountAmount && sale.discountAmount > 0 && (
                     <div className="flex justify-between">
                        <span>
                            {receiptInfo.discountLabel}
                            {sale.discountType === 'percentage' && sale.subtotal > 0 && ` (${Math.round((sale.discountAmount / sale.subtotal) * 100)}%)`}
                        </span>
                        <span className="text-black">- {formatCurrency(sale.discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-base mt-1">
                    <span>{receiptInfo.totalLabel}</span>
                    <span>{formatCurrency(sale.total)}</span>
                </div>
            </div>
            
             <div className="border-t border-dashed border-black mt-2 pt-2">
                 <div className="flex justify-between">
                    <span>{receiptInfo.paymentMethodLabel}</span>
                    <span>{paymentMethodLabels[sale.payments[0]?.method || 'other']}</span>
                </div>
                <div className="flex justify-between">
                    <span>{receiptInfo.amountPaidLabel}</span>
                    <span>{formatCurrency(sale.amountPaid)}</span>
                </div>
                {sale.remainingBalance > 0 ? (
                     <div className="flex justify-between text-red-600 font-bold">
                        <span>{receiptInfo.creditLabel}</span>
                        <span>{formatCurrency(sale.remainingBalance)}</span>
                    </div>
                ) : (
                    <div className="flex justify-between">
                        <span>{receiptInfo.changeLabel}</span>
                        <span>{formatCurrency(sale.change ?? 0)}</span>
                    </div>
                )}
            </div>


            <div className="text-center mt-4">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />}
                <p className="mt-2">{receiptInfo.thankYou}</p>
            </div>
        </div>
    );
});
Receipt.displayName = 'Receipt';

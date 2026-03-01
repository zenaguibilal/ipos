'use client';

import React from 'react';
import type { CompanyProfile, Sale, SaleItem } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { formatCurrency } from '@/lib/utils';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface ReceiptProps {
  sale: Sale & { change?: number };
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale }, ref) => {
    const companyProfile = useLiveQuery(() => db.companyProfile.get(1));
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const receiptInfo = {
        title: "REÇU DE VENTE",
        shopName: companyProfile?.companyName || "iPOS Store",
        address: companyProfile?.address || "",
        city: `${companyProfile?.zipCode || ''} ${companyProfile?.city || ''}`,
        phone: `Tél: ${companyProfile?.phone || ''}`,
        rc: `RC: ${companyProfile?.rcNumber || ''}`,
        nif: `NIF: ${companyProfile?.vatNumber || ''}`,
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
        amountPaidLabel: "Montant Payé:",
        changeLabel: "Monnaie Rendue:",
        creditLabel: "Solde Restant (Crédit):",
        thankYou: "Merci de votre visite !",
    };
    
    useEffect(() => {
        if (!sale) return;
        const details = [
            `Facture: ${sale.invoiceNumber}`,
            `Date: ${format(sale.createdAt!, 'Pp', { locale: fr })}`,
            `Total: ${formatCurrency(sale.total)}`
        ].join('\n');
        
        QRCode.toDataURL(details, { errorCorrectionLevel: 'M' })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error("QR Code generation failed:", err));

    }, [sale]);

    return (
        <div ref={ref} className="p-4 bg-white text-black text-sm font-mono">
            <div className="text-center mb-4">
                <h2 className="text-lg font-bold">{receiptInfo.shopName}</h2>
                {receiptInfo.address && <p>{receiptInfo.address}</p>}
                {receiptInfo.city.trim() && <p>{receiptInfo.city}</p>}
                {receiptInfo.phone.replace('Tél: ', '') && <p>{receiptInfo.phone}</p>}
                <div className="flex justify-center gap-4 text-xs">
                    {receiptInfo.rc.replace('RC: ', '') && <p>{receiptInfo.rc}</p>}
                    {receiptInfo.nif.replace('NIF: ', '') && <p>{receiptInfo.nif}</p>}
                </div>
            </div>

            <div className="border-t border-b border-dashed border-black my-2 py-2">
                <div className="flex justify-between">
                    <span>{receiptInfo.invoiceLabel}</span>
                    <span>{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>{receiptInfo.dateLabel}</span>
                    <span>{format(sale.createdAt!, 'Pp', { locale: fr })}</span>
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
                        <span>{formatCurrency(sale.amountPaid - sale.total)}</span>
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

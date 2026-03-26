'use client';

import React, { useEffect, useRef } from 'react';
import type { Sale, Customer, CompanyProfile } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QRCode from 'qrcode';

interface ReceiptProps {
  sale: Sale;
  customer: Customer | null;
  profile: CompanyProfile | null;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, customer, profile }, ref) => {
    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (profile?.website && qrCodeRef.current) {
            QRCode.toCanvas(qrCodeRef.current, profile.website, { width: 64, margin: 1, errorCorrectionLevel: 'L' }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [profile?.website]);

    const change = sale.amountPaid - sale.total;

    return (
        <div ref={ref} className="p-2 w-full text-black bg-white">
            <header className="text-center mb-2">
                <h1 className="text-lg font-bold">{profile?.companyName || 'Mon Magasin'}</h1>
                {profile?.address && <p className="text-xs">{profile.address}</p>}
                {profile?.phone && <p className="text-xs">Tél: {profile.phone}</p>}
                {profile?.rcNumber && <p className="text-xs">RC: {profile.rcNumber}</p>}
            </header>

            <div className="text-xs my-2">
                <p>Facture: <strong>{sale.invoiceNumber}</strong></p>
                <p>Date: {format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                {customer && <p>Client: {customer.firstName} {customer.lastName}</p>}
            </div>

            <table className="w-full text-xs">
                <thead>
                    <tr className="border-t border-b border-dashed border-black">
                        <th className="text-left py-1">Article</th>
                        <th className="text-center py-1">Qté</th>
                        <th className="text-right py-1">Prix U.</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-0.5">{item.name}</td>
                            <td className="text-center py-0.5">{item.quantity}</td>
                            <td className="text-right py-0.5">{item.price.toFixed(2)}</td>
                            <td className="text-right py-0.5">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t border-dashed border-black mt-2 pt-2 text-xs">
                <div className="flex justify-between"><span>Sous-total:</span><span>{formatCurrency(sale.subtotal)}</span></div>
                {sale.discountAmount && sale.discountAmount > 0 ? (
                    <div className="flex justify-between"><span>Remise:</span><span>- {formatCurrency(sale.discountAmount)}</span></div>
                ) : null}
                <div className="flex justify-between font-bold text-base mt-1"><span>TOTAL:</span><span>{formatCurrency(sale.total)}</span></div>
            </div>

            <div className="border-t border-dashed border-black mt-2 pt-2 text-xs">
                 {sale.payments.map((p, i) => (
                     <div key={i} className="flex justify-between">
                        <span>Payé ({p.method === 'cash' ? 'Espèces' : 'Carte'}):</span>
                        <span>{formatCurrency(p.amount)}</span>
                    </div>
                ))}
                 {change >= 0.01 && <div className="flex justify-between"><span>Monnaie rendue:</span><span>{formatCurrency(change)}</span></div>}
                {sale.remainingBalance > 0 && <div className="flex justify-between font-bold"><span>Reste à payer:</span><span>{formatCurrency(sale.remainingBalance)}</span></div>}
            </div>

            <footer className="text-center mt-4 text-xs">
                <p>Merci de votre visite !</p>
                {profile?.website && <canvas ref={qrCodeRef} className="mx-auto mt-1"></canvas>}
            </footer>
        </div>
    );
});
Receipt.displayName = 'Receipt';

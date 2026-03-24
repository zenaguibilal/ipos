'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import QRCode from 'qrcode';

interface ReceiptProps {
  sale: Sale;
  profile: CompanyProfile | null;
  thermal?: boolean;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, profile, thermal }, ref) => {
    const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState('');

    React.useEffect(() => {
        const qrText = `Facture: ${sale.invoiceNumber}, Total: ${sale.total} ${profile?.companyName || ''}`;
        QRCode.toDataURL(qrText, { width: 80, margin: 1 })
            .then(url => setQrCodeDataUrl(url))
            .catch(err => console.error(err));
    }, [sale, profile]);

    const receiptClass = thermal ? 'thermal-receipt' : 'a4-receipt';
    
    return (
        <div ref={ref} className={`${receiptClass} p-4 bg-white text-black font-sans`}>
            {/* Header */}
            <header className="text-center mb-4">
                {profile?.companyName && <h1 className="text-lg font-bold uppercase">{profile.companyName}</h1>}
                {profile?.address && <p className="text-xs">{profile.address}</p>}
                {profile?.phone && <p className="text-xs">Tél: {profile.phone}</p>}
            </header>

            {/* Sale Info */}
            <section className="text-xs mb-2">
                <p>Facture: {sale.invoiceNumber}</p>
                <p>Date: {format(sale.createdAt || new Date(), 'd/MM/yy HH:mm', { locale: fr })}</p>
                {sale.customerName && <p>Client: {sale.customerName}</p>}
            </section>

            {/* Items Table */}
            <table className="w-full text-xs mb-2">
                <thead>
                    <tr className="border-t border-b border-dashed border-black">
                        <th className="text-left py-1">Article</th>
                        <th className="text-center py-1">Qté</th>
                        <th className="text-right py-1">P.U.</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-0.5">{item.name}</td>
                            <td className="text-center py-0.5">{item.quantity}</td>
                            <td className="text-right py-0.5">{item.price.toFixed(1)}</td>
                            <td className="text-right py-0.5">{(item.price * item.quantity).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <section className="text-xs border-t border-dashed border-black pt-2">
                <div className="flex justify-between"><span>Sous-total:</span><span>{formatCurrency(sale.subtotal)}</span></div>
                {sale.discountAmount && sale.discountAmount > 0 ? (
                    <div className="flex justify-between"><span>Remise:</span><span>- {formatCurrency(sale.discountAmount)}</span></div>
                ): null}
                <div className="flex justify-between font-bold text-base mt-1"><span>TOTAL:</span><span>{formatCurrency(sale.total)}</span></div>
                
                 <div className="border-t border-dashed border-black mt-2 pt-2">
                    {sale.payments.map((p, i) => (
                         <div key={i} className="flex justify-between">
                            <span>Payé ({p.method}):</span>
                            <span>{formatCurrency(p.amount)}</span>
                        </div>
                    ))}
                    {sale.remainingBalance < 0 && (
                        <div className="flex justify-between"><span>Monnaie rendue:</span><span>{formatCurrency(Math.abs(sale.remainingBalance))}</span></div>
                    )}
                </div>
            </section>
            
            {/* Footer */}
            <footer className="text-center text-xs mt-4">
                {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto" />}
                <p className="mt-2">Merci de votre visite !</p>
            </footer>
        </div>
    );
});
Receipt.displayName = 'Receipt';


'use client';

import { useEffect, useRef } from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { safeToDate } from '@/lib/utils';

interface ThermalReceiptProps {
    sale: Sale;
    companyProfile?: CompanyProfile | null;
}

export function ThermalReceipt({ sale, companyProfile }: ThermalReceiptProps) {
    const barcodeRef = useRef<SVGSVGElement | null>(null);
    const qrCodeRef = useRef<HTMLCanvasElement | null>(null);
    const saleDate = safeToDate(sale.createdAt);

    // Data for QR Code
    const receiptData = JSON.stringify({
        invoice: sale.invoiceNumber,
        date: saleDate.toISOString(),
        total: sale.total,
    });

    useEffect(() => {
        if (barcodeRef.current && sale.invoiceNumber) {
            try {
                JsBarcode(barcodeRef.current, sale.invoiceNumber, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 14,
                    margin: 0,
                });
            } catch (e) {
                console.error("Erreur de génération du code-barres:", e);
                // Hide barcode on error
                if (barcodeRef.current) {
                    barcodeRef.current.style.display = 'none';
                }
            }
        }
    }, [sale.invoiceNumber]);

    useEffect(() => {
        if (qrCodeRef.current) {
            QRCode.toCanvas(qrCodeRef.current, receiptData, {
                width: 80,
                margin: 1,
                errorCorrectionLevel: 'L'
            }, (error) => {
                if (error) console.error("Erreur de génération du QR Code:", error);
            });
        }
    }, [receiptData]);


    return (
        <div className="thermal-receipt bg-white text-black font-mono">
            <header className="text-center space-y-1 mb-2">
                {companyProfile?.companyName && <h1 className="text-lg font-bold">{companyProfile.companyName}</h1>}
                {companyProfile?.address && <p className="text-xs">{companyProfile.address}</p>}
                {companyProfile?.city && <p className="text-xs">{`${companyProfile.zipCode || ''} ${companyProfile.city}`.trim()}</p>}
                {companyProfile?.phone && <p className="text-xs">Tél: {companyProfile.phone}</p>}
                {companyProfile?.vatNumber && <p className="text-xs">N° TVA: {companyProfile.vatNumber}</p>}
                
                <div className="text-xs pt-2">
                    <p>Facture N°: <span className="font-bold">{sale.invoiceNumber}</span></p>
                    <p>{format(saleDate, 'd MMM yyyy, HH:mm', { locale: fr })}</p>
                    <p>Client: {sale.customerName || 'Vente au comptoir'}</p>
                </div>
            </header>
            
            <div className="border-t border-b border-dashed border-black my-2"></div>

            <table className="w-full text-xs my-2">
                <thead>
                    <tr>
                        <th className="text-left py-1">Article</th>
                        <th className="text-center">Qté</th>
                        <th className="text-right">Prix</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index} >
                            <td className="py-1 w-1/2 align-top break-words">{item.name}</td>
                            <td className="text-center align-top">{item.cartQuantity || item.quantity}</td>
                            <td className="text-right align-top">{item.price.toFixed(2)}</td>
                            <td className="text-right font-bold align-top">{(item.price * (item.cartQuantity || item.quantity)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="border-t border-dashed border-black my-2"></div>

            <div className="text-xs space-y-1 mt-2">
                <div className="flex justify-between">
                    <span>Montant Payé:</span>
                    <span>{sale.amountPaid.toFixed(2)} DA</span>
                </div>
                <div className="flex justify-between">
                    <span>Solde Restant:</span>
                    <span>{sale.remainingBalance.toFixed(2)} DA</span>
                </div>
                 <div className="flex justify-between font-bold text-base border-t-2 border-black pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>{sale.total.toFixed(2)} DA</span>
                </div>
            </div>

            <footer className="flex flex-col items-center mt-4 space-y-4">
                <svg ref={barcodeRef}></svg>
                <canvas ref={qrCodeRef}></canvas>
                <p className="text-center text-xs mt-2">Merci pour votre visite !</p>
            </footer>
        </div>
    );
}

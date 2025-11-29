
'use client';

import type { PurchaseOrder, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ThermalReceiptPOProps {
    purchaseOrder: PurchaseOrder;
    companyProfile: CompanyProfile;
}

export function ThermalReceiptPO({ purchaseOrder, companyProfile }: ThermalReceiptPOProps) {
    const poDate = purchaseOrder.createdAt.toDate();

    return (
        <div className="thermal-receipt bg-white text-black font-mono">
            <header className="text-center space-y-1 mb-2">
                {companyProfile?.companyName && <h1 className="text-lg font-bold">{companyProfile.companyName}</h1>}
                {companyProfile?.address && <p className="text-xs">{companyProfile.address}</p>}
                {companyProfile?.phone && <p className="text-xs">Tél: {companyProfile.phone}</p>}
                
                <div className="text-xs pt-2 font-bold">
                    BON DE COMMANDE
                </div>
                <div className="text-xs pt-1">
                    <p>N°: <span className="font-bold">{purchaseOrder.poNumber}</span></p>
                    <p>Date: {format(poDate, 'dd/MM/yy HH:mm', { locale: fr })}</p>
                    <p>Fournisseur: {purchaseOrder.supplierName}</p>
                </div>
            </header>
            
            <div className="border-t border-b border-dashed border-black my-2"></div>

            <table className="w-full text-xs my-2">
                <thead>
                    <tr>
                        <th className="text-left py-1">Article</th>
                        <th className="text-center">Qté</th>
                        <th className="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {purchaseOrder.items.map((item, index) => (
                        <tr key={index} >
                            <td className="py-1 w-2/3 align-top break-words pr-1">{item.productName}</td>
                            <td className="text-center align-top">{item.quantity}</td>
                            <td className="text-right font-bold align-top">{(item.purchasePrice * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="border-t border-dashed border-black my-2"></div>

            <div className="text-xs space-y-1 mt-2">
                 <div className="flex justify-between font-bold text-base border-t-2 border-black pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>{purchaseOrder.totalValue.toFixed(2)} DA</span>
                </div>
            </div>

            {purchaseOrder.notes && (
                 <div className="my-2 text-xs border-t border-dashed border-black pt-2">
                    <p className="font-bold">Notes:</p>
                    <p className="whitespace-pre-wrap">{purchaseOrder.notes}</p>
                </div>
            )}

            <footer className="text-center text-xs mt-4 pt-2 border-t border-dashed border-black">
                <p>Merci de préparer cette commande.</p>
            </footer>
        </div>
    );
}


'use client';

import type { PurchaseOrder, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

interface PurchaseOrderReceiptProps {
    purchaseOrder: PurchaseOrder;
    companyProfile: CompanyProfile;
}

export function PurchaseOrderReceipt({ purchaseOrder, companyProfile }: PurchaseOrderReceiptProps) {
    const poDate = purchaseOrder.createdAt.toDate();

    return (
        <div className="bg-white text-black font-sans p-4">
            {/* Header */}
            <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                <div className="flex-1">
                    {companyProfile?.companyName && <h1 className="text-2xl font-bold text-gray-800">{companyProfile.companyName}</h1>}
                    {companyProfile?.address && <p className="text-xs text-gray-600">{companyProfile.address}</p>}
                    {companyProfile?.city && <p className="text-xs text-gray-600">{companyProfile.city}</p>}
                    {companyProfile?.phone && <p className="text-xs text-gray-600">Tél: {companyProfile.phone}</p>}
                </div>
                 <div className="flex-shrink-0 w-24 h-24 relative">
                    <Image src="/logo.png" alt="Logo" layout="fill" objectFit="contain" unoptimized />
                </div>
            </header>
            
            {/* PO Info */}
            <section className="my-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">BON DE COMMANDE</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-bold">Fournisseur:</p>
                        <p className="text-gray-700">{purchaseOrder.supplierName}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-bold">N°:</span> {purchaseOrder.poNumber}</p>
                        <p><span className="font-bold">Date:</span> {format(poDate, 'd MMMM yyyy', { locale: fr })}</p>
                    </div>
                </div>
            </section>

            {/* Items Table */}
            <table className="w-full text-sm my-6 border-t border-b border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">Produit</th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-600">Quantité</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Prix d'Achat (Unitaire)</th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {purchaseOrder.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-2 px-2">{item.productName}</td>
                            <td className="text-center py-2 px-2">{item.quantity}</td>
                            <td className="text-right py-2 px-2">{item.purchasePrice.toFixed(2)} DA</td>
                            <td className="text-right font-medium py-2 px-2">{(item.purchasePrice * item.quantity).toFixed(2)} DA</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Notes */}
            {purchaseOrder.notes && (
                 <div className="my-6 text-sm">
                    <p className="font-bold">Notes:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                </div>
            )}
            
            {/* Total */}
            <section className="flex justify-end my-6">
                <div className="w-full max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-lg bg-gray-100 p-2 rounded-md">
                        <span>TOTAL:</span>
                        <span>{purchaseOrder.totalValue.toFixed(2)} DA</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-xs text-gray-500 pt-4 border-t-2 border-gray-200 mt-8">
                <p>Merci de préparer cette commande.</p>
                <p>{companyProfile?.companyName || "iPOS"}</p>
            </footer>
        </div>
    );
}

    
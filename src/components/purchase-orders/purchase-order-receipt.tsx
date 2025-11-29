
'use client';

import type { PurchaseOrder, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PurchaseOrderReceiptProps {
    purchaseOrder: PurchaseOrder;
    companyProfile: CompanyProfile;
}

export function PurchaseOrderReceipt({ purchaseOrder, companyProfile }: PurchaseOrderReceiptProps) {
    const poDate = purchaseOrder.createdAt.toDate();

    return (
        <div className="bg-white text-black font-sans p-8 text-sm">
            {/* Header */}
            <header className="flex justify-between items-start pb-4 border-b-2 border-gray-300">
                <div className="flex-1">
                    {companyProfile?.companyName && <h1 className="text-3xl font-bold text-gray-800">{companyProfile.companyName}</h1>}
                    {companyProfile?.address && <p className="text-xs text-gray-600">{companyProfile.address}</p>}
                    {companyProfile?.city && <p className="text-xs text-gray-600">{companyProfile.city}, {companyProfile.zipCode}</p>}
                    {companyProfile?.country && <p className="text-xs text-gray-600">{companyProfile.country}</p>}
                    {companyProfile?.phone && <p className="text-xs text-gray-600">Tél: {companyProfile.phone}</p>}
                    {companyProfile?.vatNumber && <p className="text-xs text-gray-600">N° TVA: {companyProfile.vatNumber}</p>}
                </div>
            </header>
            
            {/* PO Info */}
            <section className="my-8">
                <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">BON DE COMMANDE</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-3 rounded">
                        <p className="font-bold text-gray-600">Fournisseur:</p>
                        <p className="text-gray-800 font-semibold">{purchaseOrder.supplierName}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded text-right">
                        <p><span className="font-bold text-gray-600">N° Commande:</span> <span className="font-mono">{purchaseOrder.poNumber}</span></p>
                        <p><span className="font-bold text-gray-600">Date:</span> {format(poDate, 'd MMMM yyyy', { locale: fr })}</p>
                    </div>
                </div>
            </section>

            {/* Items Table */}
            <table className="w-full text-sm my-8">
                <thead className="border-b-2 border-gray-800">
                    <tr>
                        <th className="text-left py-2 px-2 font-bold text-gray-700 uppercase">Produit</th>
                        <th className="text-center py-2 px-2 font-bold text-gray-700 uppercase">Quantité</th>
                        <th className="text-right py-2 px-2 font-bold text-gray-700 uppercase">Prix d'Achat (Unitaire)</th>
                        <th className="text-right py-2 px-2 font-bold text-gray-700 uppercase">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {purchaseOrder.items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-3 px-2">{item.productName}</td>
                            <td className="text-center py-3 px-2">{item.quantity}</td>
                            <td className="text-right py-3 px-2">{item.purchasePrice.toFixed(2)} DA</td>
                            <td className="text-right font-medium py-3 px-2">{(item.purchasePrice * item.quantity).toFixed(2)} DA</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Notes */}
            {purchaseOrder.notes && (
                 <div className="my-8 text-sm p-3 bg-gray-50 rounded">
                    <p className="font-bold text-gray-600">Notes:</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                </div>
            )}
            
            {/* Total */}
            <section className="flex justify-end my-8">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between font-bold text-2xl bg-gray-200 p-4 rounded">
                        <span>TOTAL:</span>
                        <span>{purchaseOrder.totalValue.toFixed(2)} DA</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center text-xs text-gray-500 pt-6 border-t-2 border-gray-300 mt-12">
                <p>Merci de préparer cette commande dans les meilleurs délais.</p>
                <p className="font-bold mt-1">{companyProfile?.companyName || "iPOS"}</p>
            </footer>
        </div>
    );
}

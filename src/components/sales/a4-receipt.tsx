
'use client';

import type { Sale, CompanyProfile, Customer } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate } from '@/lib/utils';
import Image from 'next/image';

interface A4ReceiptProps {
    sale: Sale;
    companyProfile: CompanyProfile | null;
    customer: Customer | null;
}

export function A4Receipt({ sale, companyProfile, customer }: A4ReceiptProps) {
    if (!sale) return null;

    const saleDate = safeToDate(sale.createdAt);

    // Provide fallbacks for potentially missing numeric fields in old sale documents
    const calculatedSubtotal = sale.items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    const subtotal = sale.subtotal ?? calculatedSubtotal;
    const total = sale.total ?? subtotal; // Simplified fallback
    const amountPaid = sale.amountPaid ?? 0;
    const remainingBalance = sale.remainingBalance ?? (total - amountPaid);
    const discountDisplay = subtotal - total;

    return (
        <div className="a4-receipt bg-white text-black p-8 font-sans text-sm">
            {/* Header */}
            <header className="flex justify-between items-start pb-8 border-b">
                <div className="flex items-center gap-4">
                    {/* Placeholder for a logo */}
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">Logo</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{companyProfile?.companyName || 'Votre Entreprise'}</h1>
                        <p>{companyProfile?.address}</p>
                        <p>{`${companyProfile?.zipCode || ''} ${companyProfile?.city || ''}`}</p>
                        <p>{companyProfile?.country}</p>
                        <p>Tél: {companyProfile?.phone}</p>
                        <p>Email: {companyProfile?.email}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-gray-700">Facture</h2>
                    <p className="mt-2">N°: <span className="font-semibold">{sale.invoiceNumber}</span></p>
                    <p>Date: <span className="font-semibold">{format(saleDate, 'd MMMM yyyy', { locale: fr })}</span></p>
                </div>
            </header>

            {/* Customer Info */}
            <section className="my-8">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-600 uppercase mb-2">Facturé à</h3>
                        <p className="font-bold">{sale.customerName || 'Client au comptoir'}</p>
                        {customer?.phone && <p>{customer.phone}</p>}
                    </div>
                </div>
            </section>

            {/* Items Table */}
            <section className="my-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 font-semibold">Description</th>
                            <th className="p-3 font-semibold text-center w-24">Quantité</th>
                            <th className="p-3 font-semibold text-right w-32">Prix Unitaire</th>
                            <th className="p-3 font-semibold text-right w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">{(item.price || 0).toFixed(1)} DA</td>
                                <td className="p-3 text-right font-semibold">{((item.price || 0) * item.quantity).toFixed(1)} DA</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Totals */}
            <section className="my-8 flex justify-end">
                <div className="w-full max-w-sm space-y-2 text-right">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Sous-total:</span>
                        <span className="font-semibold">{subtotal.toFixed(1)} DA</span>
                    </div>
                    {sale.discountAmount && sale.discountAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Remise:</span>
                            <span className="font-semibold">-{discountDisplay.toFixed(1)} DA</span>
                        </div>
                    )}
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between text-xl font-bold">
                        <span>TOTAL:</span>
                        <span>{total.toFixed(1)} DA</span>
                    </div>
                    <div className="border-t my-2"></div>

                    {sale.payments?.map((p, i) => (
                        <div key={i} className="flex justify-between">
                            <span className="text-gray-600">Payé ({p.method === 'cash' ? 'Espèces' : p.method === 'card' ? 'Carte' : 'Autre'}):</span>
                            <span className="font-semibold">{p.amount.toFixed(1)} DA</span>
                        </div>
                    ))}
                    {sale.payments?.length > 1 && (
                        <div className="flex justify-between font-bold mt-1">
                            <span className="text-gray-600">Total Payé:</span>
                            <span className="font-semibold">{amountPaid.toFixed(1)} DA</span>
                        </div>
                    )}
                     <div className="flex justify-between">
                        <span className="text-gray-600">Solde Restant:</span>
                        <span className="font-semibold">{remainingBalance.toFixed(1)} DA</span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t text-center text-gray-500">
                <p>Merci pour votre confiance.</p>
                <p>{companyProfile?.website}</p>
            </footer>
        </div>
    );
}

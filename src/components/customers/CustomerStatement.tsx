
'use client';

import React from 'react';
import type { Customer, Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate } from '@/lib/utils';

interface CustomerStatementProps {
  customer: Customer;
  unpaidSales: Sale[];
  profile: CompanyProfile | null;
}

export const CustomerStatement = React.forwardRef<HTMLDivElement, CustomerStatementProps>(({ customer, unpaidSales, profile }, ref) => {
    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans">
            {/* Header */}
            <header className="flex justify-between items-start pb-4 border-b-2 border-black">
                <div>
                    <h1 className="text-2xl font-bold">{profile?.companyName || 'Mon Magasin'}</h1>
                    <p>{profile?.address}</p>
                    <p>{profile?.city}, {profile?.country}</p>
                    <p>Tél: {profile?.phone}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-gray-700">Relevé de Compte</h2>
                    <p className="text-sm">Date: {format(new Date(), 'd MMMM yyyy', { locale: fr })}</p>
                </div>
            </header>

            {/* Customer Info */}
            <section className="my-6 p-4 border border-gray-300 rounded">
                <h3 className="text-lg font-semibold mb-2">Client</h3>
                <p className="font-bold text-xl">{customer.firstName} {customer.lastName}</p>
                {customer.address && <p>{customer.address}</p>}
                {customer.phone && <p>Tél: {customer.phone}</p>}
            </section>

            {/* Financial Summary */}
            <section className="my-6 flex justify-around bg-gray-100 p-4 rounded">
                <div className="text-center">
                    <p className="text-sm uppercase text-gray-600">Limite de Crédit</p>
                    <p className="text-2xl font-bold">{formatCurrency(customer.creditLimit || 0)}</p>
                </div>
                 <div className="text-center">
                    <p className="text-sm uppercase text-gray-600">Solde Actuel</p>
                    <p className="text-2xl font-bold text-destructive">{formatCurrency(customer.outstandingBalance)}</p>
                </div>
            </section>

            {/* Unpaid Invoices */}
            <section className="my-6">
                <h3 className="text-lg font-semibold mb-2 border-b pb-1">Factures Impayées</h3>
                {unpaidSales.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Date Facture</th>
                                <th className="text-left p-2">N° Facture</th>
                                <th className="text-right p-2">Montant Total</th>
                                <th className="text-right p-2">Montant Payé</th>
                                <th className="text-right p-2 font-bold">Solde Restant</th>
                                <th className="text-center p-2">Date d'échéance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unpaidSales.map(sale => (
                                <tr key={sale.uuid} className="border-b border-gray-200">
                                    <td className="p-2">{format(safeToDate(sale.createdAt!), 'd/MM/yy')}</td>
                                    <td className="p-2">{sale.invoiceNumber}</td>
                                    <td className="text-right p-2">{formatCurrency(sale.total)}</td>
                                    <td className="text-right p-2">{formatCurrency(sale.amountPaid)}</td>
                                    <td className="text-right p-2 font-bold">{formatCurrency(sale.remainingBalance)}</td>
                                    <td className="text-center p-2">{sale.dueDate ? format(safeToDate(sale.dueDate), 'd/MM/yy') : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-600 p-4 bg-gray-100 rounded text-center">Aucune facture impayée pour ce client.</p>
                )}
            </section>

            {/* Footer */}
            <footer className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Merci de votre confiance.</p>
                <p>{profile?.companyName}</p>
            </footer>
        </div>
    );
});
CustomerStatement.displayName = 'CustomerStatement';

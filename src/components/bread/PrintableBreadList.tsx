'use client';

import React from 'react';
import type { BreadOrder, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintableBreadListProps {
  orders: BreadOrder[];
  date: Date;
  companyProfile: CompanyProfile | null;
}

export const PrintableBreadList = React.forwardRef<HTMLDivElement, PrintableBreadListProps>(({ orders, date, companyProfile }, ref) => {
  const totalQuantity = orders.reduce((acc, order) => acc + (order.todaysOrder?.quantity ?? order.defaultOrderQuantity), 0);

  return (
    <div ref={ref} className="p-8 font-sans text-black bg-white">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{companyProfile?.companyName || 'Liste des Commandes de Pain'}</h1>
        <p className="text-lg font-semibold">{format(date, 'eeee d MMMM yyyy', { locale: fr })}</p>
      </header>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="p-2 text-lg font-bold">Client</th>
            <th className="p-2 text-lg font-bold text-center">Quantité</th>
            <th className="p-2 text-lg font-bold text-center w-32">Livré</th>
            <th className="p-2 text-lg font-bold text-center w-32">Payé</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border-b">
              <td className="p-3 text-base font-medium">{order.name}</td>
              <td className="p-3 text-base font-bold text-center">{order.todaysOrder?.quantity ?? order.defaultOrderQuantity}</td>
              <td className="p-3 text-center">
                <div className="mx-auto h-6 w-6 border-2 border-black"></div>
              </td>
              <td className="p-3 text-center">
                <div className="mx-auto h-6 w-6 border-2 border-black"></div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td className="p-3 text-lg font-bold">TOTAL</td>
            <td className="p-3 text-lg font-bold text-center">{totalQuantity}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>

       <footer className="mt-8 text-center text-sm text-gray-600">
            <p>Document généré le {format(new Date(), 'd/MM/yyyy HH:mm')}</p>
        </footer>
    </div>
  );
});

PrintableBreadList.displayName = 'PrintableBreadList';

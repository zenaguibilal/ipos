'use client';

import React from 'react';
import type { BreadOrder } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintableBreadListProps {
  orders: BreadOrder[];
  date: Date;
}

export const PrintableBreadList: React.FC<PrintableBreadListProps> = ({ orders, date }) => {
    const totalQuantity = orders.reduce((sum, order) => sum + (order.todaysOrder?.quantity ?? 0), 0);
    const deliveredQuantity = orders.filter(o => o.todaysOrder?.status === 'livre' || o.todaysOrder?.status === 'paye').reduce((sum, order) => sum + (order.todaysOrder?.quantity ?? 0), 0);

    return (
        <div className="p-4 bg-white text-black font-sans hidden print:block">
            <header className="text-center mb-6">
                <h1 className="text-2xl font-bold">Liste de Livraison de Pain</h1>
                <p className="text-lg">{format(date, 'EEEE d MMMM yyyy', { locale: fr })}</p>
            </header>

            <table className="w-full text-base border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left p-2 w-12"></th>
                        <th className="text-left p-2">Client</th>
                        <th className="text-center p-2 w-32">Quantité</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.filter(o => o.todaysOrder).map((order) => (
                        <tr key={order.id} className="border-b border-gray-300">
                            <td className="p-3 text-center">
                                <div className="h-6 w-6 border-2 border-black rounded-sm"></div>
                            </td>
                            <td className="p-3 font-medium">{order.name}</td>
                            <td className="p-3 text-center font-bold text-lg">{order.todaysOrder!.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <footer className="mt-8 pt-4 border-t-2 border-black text-right">
                <p className="text-lg font-bold">Total Commandé : {totalQuantity}</p>
                <p className="text-base">Total Livré (au moment de l'impression) : {deliveredQuantity}</p>
            </footer>
        </div>
    );
};

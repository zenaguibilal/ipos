'use client';
import type { BreadOrder } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintableBreadListProps {
    orders: BreadOrder[];
    totalQuantity: number;
}

export function PrintableBreadList({ orders, totalQuantity }: PrintableBreadListProps) {
    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px', color: 'black' }}>
            <header style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #ccc' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Liste des commandes de pain</h1>
                <p style={{ fontSize: '16px' }}>Date: {format(new Date(), 'd MMMM yyyy', { locale: fr })}</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Quantité totale: {totalQuantity}</p>
            </header>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '14px' }}>Nom</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px' }}>Quantité</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px', width: '80px' }}>Payé</th>
                        <th style={{ padding: '8px', textAlign: 'center', fontSize: '14px', width: '80px' }}>Livré</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 8px', fontSize: '18px', fontWeight: '500' }}>{order.name}</td>
                            <td style={{ padding: '12px 8px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>{order.quantity}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <div style={{ width: '20px', height: '20px', border: '1px solid #000', margin: '0 auto' }}></div>
                            </td>
                             <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                <div style={{ width: '20px', height: '20px', border: '1px solid #000', margin: '0 auto' }}></div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

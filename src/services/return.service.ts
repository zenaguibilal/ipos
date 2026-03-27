
'use client';
/**
 * @fileOverview Return Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { ProductReturn, Customer } from '@/lib/types';
import Papa from 'papaparse';

class ReturnService {
    async getReturnByUuid(uuid: string): Promise<ProductReturn | undefined> {
        return api.get<ProductReturn>(`returns/${uuid}`);
    }

    async filterReturns(filters: any): Promise<ProductReturn[]> {
        const query = new URLSearchParams(filters).toString();
        return api.get<ProductReturn[]>(`returns?${query}`);
    }
    
    async addReturn(data: any): Promise<ProductReturn> {
        return api.post<ProductReturn>('returns', data);
    }

    async processReturnCancellation(uuid: string): Promise<void> {
        return api.delete(`returns/${uuid}`);
    }

    async exportToCSV(returns: ProductReturn[], customerMap: Map<string, Customer>) {
        const rows = returns.flatMap(pr => {
            const customer = pr.customerUuid ? customerMap.get(pr.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
            return pr.items.map(item => ({
                'Date': pr.createdAt,
                'Facture': pr.originalInvoiceNumber,
                'Client': customerName,
                'Article': item.productName,
                'Total': item.price * item.quantity
            }));
        });
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `returns-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

export const returnService = new ReturnService();

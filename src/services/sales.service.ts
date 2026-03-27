'use client';
/**
 * @fileOverview Sales Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { Sale, Customer } from '@/lib/types';
import Papa from 'papaparse';

class SalesService {
    async getAllSales(): Promise<Sale[]> {
        return api.get<Sale[]>('sales');
    }

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return api.get<Sale>(`sales/${uuid}`);
    }
    
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return api.get<Sale>(`sales/invoice/${invoiceNumber}`);
    }

    async findSalesByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        return api.get<Sale[]>(`customers/${customerUuid}/sales`);
    }

    async filterSales(filters: any): Promise<Sale[]> {
        const query = new URLSearchParams(filters).toString();
        return api.get<Sale[]>(`sales?${query}`);
    }

    async createSale(saleData: any): Promise<Sale> {
        return api.post<Sale>('sales', saleData);
    }

    async processSaleCancellation(uuid: string): Promise<void> {
        return api.delete(`sales/${uuid}`);
    }

    async exportToCSV(sales: Sale[], customerMap: Map<string, Customer>) {
        const rows = sales.map(s => ({
            'Facture': s.invoiceNumber,
            'Total': s.total,
            'Date': s.createdAt,
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

export const salesService = new SalesService();

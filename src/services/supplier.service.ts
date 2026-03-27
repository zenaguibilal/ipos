'use client';
/**
 * @fileOverview Supplier Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { Supplier, SupplierPayment } from '@/lib/types';
import Papa from 'papaparse';

class SupplierService {
    async getSuppliers(): Promise<Supplier[]> {
        return api.get<Supplier[]>('suppliers');
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        return api.get<Supplier>(`suppliers/${uuid}`);
    }

    async findOrCreateSupplier(name: string, uuid?: string): Promise<Supplier> {
        return api.post<Supplier>('suppliers/find-or-create', { name, uuid });
    }

    async updateSupplier(uuid: string, data: Partial<Supplier>): Promise<Supplier> {
        return api.put<Supplier>(`suppliers/${uuid}`, data);
    }

    async deleteSupplier(uuid: string): Promise<void> {
        return api.delete(`suppliers/${uuid}`);
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        return api.post('suppliers/bulk-delete', { uuids });
    }

    async getSupplierActivity(uuid: string): Promise<any[]> {
        return api.get<any[]>(`suppliers/${uuid}/activity`);
    }

    async addPayment(paymentData: any): Promise<SupplierPayment> {
        return api.post<SupplierPayment>('suppliers/payments', paymentData);
    }

    async parseAndAnalyzeImport(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    // Client-side analysis logic
                    const suppliers = await this.getSuppliers();
                    const existingNames = new Map(suppliers.map(s => [s.name.toLowerCase().trim(), s]));
                    const toAdd = [], toUpdate = [], errors = [];
                    for (const row of results.data as any[]) {
                        if (!row.name) { errors.push({...row, error: "Missing name"}); continue; }
                        if (existingNames.has(row.name.toLowerCase().trim())) toUpdate.push({...row, uuid: existingNames.get(row.name.toLowerCase().trim())?.uuid});
                        else toAdd.push(row);
                    }
                    resolve({ toAdd, toUpdate, errors, total: results.data.length });
                },
                error: reject
            });
        });
    }

    async executeImport(data: any): Promise<void> {
        return api.post('suppliers/bulk-import', data);
    }

    async exportToCSV(suppliers: Supplier[]) {
        const csv = Papa.unparse(suppliers.map(s => ({ 'Nom': s.name, 'Solde': s.balance })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

export const supplierService = new SupplierService();

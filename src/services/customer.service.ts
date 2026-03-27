'use client';
/**
 * @fileOverview Customer Service (API Wall Implementation)
 * Communicates exclusively through the API layer.
 */
import { api } from '@/lib/api-client';
import type { Customer, ImportAnalysis, CustomerTopProduct, Sale } from '@/lib/types';
import Papa from 'papaparse';

class CustomerService {
    async getCustomers(): Promise<Customer[]> {
        return api.get<Customer[]>('customers');
    }
    
    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        return api.get<Customer>(`customers/${uuid}`);
    }

    async filterCustomers(filters: any): Promise<{ data: Customer[], total: number }> {
        const query = new URLSearchParams(filters).toString();
        const data = await api.get<Customer[]>(`customers?${query}`);
        return { data, total: data.length };
    }

    async getCategories(): Promise<string[]> {
        return api.get<string[]>('customers/categories');
    }

    async getStats(): Promise<{ total: number; overdue: number; overLimit: number; totalDebt: number }> {
        return api.get<any>('customers/stats');
    }
    
    async addCustomer(customerData: any): Promise<Customer> {
        return api.post<Customer>('customers', customerData);
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        return api.put<Customer>(`customers/${uuid}`, customerData);
    }

    async deleteCustomer(uuid: string): Promise<void> {
        return api.delete(`customers/${uuid}`);
    }

    async getCustomerTopProducts(uuid: string): Promise<CustomerTopProduct[]> {
        return api.get<CustomerTopProduct[]>(`customers/${uuid}/top-products`);
    }

    async getCustomerFinancialSummary(uuid: string) {
        return api.get<any>(`customers/${uuid}/financial-summary`);
    }

    async getCustomerActivity(uuid: string, page = 1, pageSize = 15): Promise<any[]> {
        return api.get<any[]>(`customers/${uuid}/activity?page=${page}&pageSize=${pageSize}`);
    }

    async getCustomerStatementData(uuid: string): Promise<{ customer: Customer, unpaidSales: Sale[] }> {
        return api.get<any>(`customers/${uuid}/statement`);
    }

    async parseAndAnalyzeImport(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    // Logic for analysis remains client-side for performance
                    const analysis = await this._analyzeImportData(results.data);
                    resolve(analysis);
                },
                error: reject
            });
        });
    }

    private async _analyzeImportData(csvData: any[]): Promise<ImportAnalysis> {
        // Analysis logic calls API to check existence
        const existingCustomers = await this.getCustomers();
        const existingNames = new Map(existingCustomers.map(c => [c.searchName, c]));

        const analysis: ImportAnalysis = {
            customersToAdd: [],
            customersToUpdate: [],
            skippedRows: [],
            errorRows: [],
            totalRows: csvData.length,
        };

        for (const row of csvData) {
            const firstName = row.firstName || row.prenom || row.first_name;
            const lastName = row.lastName || row.nom || row.last_name;
            if (!firstName || !lastName) {
                analysis.errorRows.push({ ...row, error: "Missing identity" });
                continue;
            }
            const sName = `${firstName} ${lastName}`.toLowerCase().trim();
            const existing = existingNames.get(sName);
            if (existing) analysis.customersToUpdate.push({ ...row, uuid: existing.uuid });
            else analysis.customersToAdd.push(row);
        }
        return analysis;
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        return api.post('customers/bulk', confirmedData);
    }

    async exportToCSV(customers: Customer[]) {
        const data = customers.map(c => ({
            'Nom': `${c.firstName} ${c.lastName}`,
            'Téléphone': c.phone || '',
            'Solde': c.outstandingBalance,
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }
}

export const customerService = new CustomerService();

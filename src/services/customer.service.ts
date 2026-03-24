'use client';

import { db } from '@/lib/database';
import type { Customer, Sale, Payment, ProductReturn, ImportAnalysis } from '@/lib/types';
import { format } from 'date-fns';

export class CustomerService {
    async getCustomerById(id: number): Promise<Customer | undefined> {
        return await db.customers.get(id);
    }
    
    async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> {
        const sales = await db.sales.where('customerId').equals(customerId).toArray();
        const payments = await db.payments.where('customerId').equals(customerId).toArray();
        const returns = await db.returns.where('customerId').equals(customerId).toArray();
        
        const activity = [
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt!, id: `sale-${s.id}` })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate, id: `payment-${p.id}` })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt!, id: `return-${r.id}` })),
        ];

        return activity.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
        const customer = await db.customers.get(customerId);
        if (!customer) throw new Error("Client non trouvé");
        const unpaidSales = await db.sales
            .where('customerId').equals(customerId)
            .and(sale => sale.paymentStatus !== 'paid')
            .orderBy('createdAt').toArray();
        return { customer, unpaidSales };
    }

    async getCustomers(params: { query?: string, status?: string }): Promise<Customer[]> {
        let collection = db.customers.orderBy('lastActivityDate').reverse();

        if (params.query || (params.status && params.status !== 'all')) {
            collection = collection.filter(c => {
                let passes = true;
                if (params.query) {
                    const q = params.query.toLowerCase();
                    passes = passes && (c.searchName?.toLowerCase().includes(q) || c.phone?.includes(q));
                }
                if (params.status && params.status !== 'all') {
                    if (params.status === 'has_debt') passes = passes && c.outstandingBalance > 0;
                    if (params.status === 'overdue') passes = passes && c.debtStatus === 'overdue';
                    if (params.status === 'over_limit') passes = passes && c.isOverLimit === true;
                }
                return passes;
            });
        }
        
        return await collection.toArray();
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
        const now = new Date();
        const newCustomer = {
            ...customer,
            searchName: `${customer.firstName} ${customer.lastName}`.toLowerCase(),
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: now,
            updatedAt: now,
            lastActivityDate: now,
        };
        const id = await db.customers.add(newCustomer as Customer);
        return { ...newCustomer, id } as Customer;
    }

    async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
        await db.transaction('rw', db.customers, async () => {
            const dataToUpdate: any = { ...customerData, updatedAt: new Date() };
            if (customerData.firstName || customerData.lastName) {
                const oldCustomer = await db.customers.get(id);
                const firstName = customerData.firstName || oldCustomer?.firstName;
                const lastName = customerData.lastName || oldCustomer?.lastName;
                dataToUpdate.searchName = `${firstName} ${lastName}`.toLowerCase();
            }
            await db.customers.update(id, dataToUpdate);
        });
    }
    
    async deleteCustomer(id: number): Promise<void> {
        await db.transaction('rw', db.customers, db.sales, db.payments, async () => {
            const salesCount = await db.sales.where('customerId').equals(id).count();
            if (salesCount > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de ventes.");
            }

            const customer = await db.customers.get(id);
            if (!customer) return;

            if (customer.outstandingBalance > 0) {
                throw new Error("Impossible de supprimer un client avec une dette existante.");
            }

            await db.customers.delete(id);
            await db.payments.where('customerId').equals(id).delete();
        });
    }

    async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
        const analysis: ImportAnalysis = { customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length };
        const existingCustomers = await db.customers.toArray();
        const existingPhones = new Set(existingCustomers.map(c => c.phone).filter(Boolean));

        for (const row of data) {
            const phone = row.phone?.trim();
            if (!row.firstName || !row.lastName) {
                analysis.errorRows.push(row);
                continue;
            }
            const existingByPhone = phone ? existingCustomers.find(c => c.phone === phone) : null;
            if (existingByPhone) {
                analysis.customersToUpdate.push({ id: existingByPhone.id, ...row });
            } else {
                analysis.customersToAdd.push(row);
            }
        }
        return analysis;
    }

    async processCustomerImport(toAdd: any[], toUpdate: any[]): Promise<void> {
        const addPromises = toAdd.map(c => this.addCustomer(c));
        const updatePromises = toUpdate.map(c => this.updateCustomer(c.id, c));
        await Promise.all([...addPromises, ...updatePromises]);
    }
}

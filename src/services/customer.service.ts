'use client';

import { db } from '@/lib/database';
import type { Customer, Sale, Payment, ProductReturn, ImportAnalysis } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class CustomerService {
    async getCustomerById(id: number): Promise<Customer | undefined> {
        const customer = await db.customers.get(id);
        if (customer?.sync_status === 'pending_delete') return undefined;
        return customer;
    }
    
    async getCustomerActivity(customerId: number): Promise<(Sale | Payment | ProductReturn)[]> {
        const sales = await db.sales.where({ customerId }).and(s => s.sync_status !== 'pending_delete').toArray();
        const payments = await db.payments.where({ customerId }).and(p => p.sync_status !== 'pending_delete').toArray();
        const returns = await db.returns.where({ customerId }).and(r => r.sync_status !== 'pending_delete').toArray();
        
        const activity = [
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt!, id: `sale-${s.id}` })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate, id: `payment-${p.id}` })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt!, id: `return-${r.id}` })),
        ];

        return activity.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async getCustomerStatementData(customerId: number): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
        const customer = await this.getCustomerById(customerId);
        if (!customer) throw new Error("Client non trouvé");
        const unpaidSales = await db.sales
            .where('customerId').equals(customerId)
            .and(sale => sale.paymentStatus !== 'paid' && sale.sync_status !== 'pending_delete')
            .orderBy('createdAt').toArray();
        return { customer, unpaidSales };
    }

    async getCustomers(params: { query?: string, status?: string } = {}): Promise<Customer[]> {
        let collection = db.customers.where('sync_status').notEqual('pending_delete');

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
        
        const sorted = await collection.sortBy('lastActivityDate');
        return sorted.reverse();
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
        const now = new Date();
        const uuid = uuidv4();
        const newCustomer: Omit<Customer, 'id'> = {
            ...customer,
            uuid,
            searchName: `${customer.firstName} ${customer.lastName}`.toLowerCase(),
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: now,
            updatedAt: now,
            lastActivityDate: now,
            sync_status: 'pending_create',
            last_modified_by: syncService.getLocalDeviceId(),
        };
        const id = await db.customers.add(newCustomer as Customer);
        await syncService.queueSyncOperation('customers', uuid, 'create', { ...newCustomer, id: undefined });
        return { ...newCustomer, id } as Customer;
    }

    async updateCustomer(id: number, customerData: Partial<Omit<Customer, 'id'>>): Promise<void> {
        await db.transaction('rw', db.customers, db.sync_queue, async () => {
            const customer = await db.customers.get(id);
            if(!customer || !customer.uuid) return;

            const dataToUpdate: any = { ...customerData, updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() };
            if (customerData.firstName || customerData.lastName) {
                const firstName = customerData.firstName || customer.firstName;
                const lastName = customerData.lastName || customer.lastName;
                dataToUpdate.searchName = `${firstName} ${lastName}`.toLowerCase();
            }
             if (customer.sync_status !== 'pending_create') {
                dataToUpdate.sync_status = 'pending_update';
            }
            await db.customers.update(id, dataToUpdate);
            await syncService.queueSyncOperation('customers', customer.uuid, 'update', dataToUpdate);
        });
    }
    
    async deleteCustomer(id: number): Promise<void> {
        await db.transaction('rw', db.customers, db.sales, db.payments, db.sync_queue, async () => {
            const salesCount = await db.sales.where('customerId').equals(id).and(s => s.sync_status !== 'pending_delete').count();
            if (salesCount > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de ventes.");
            }

            const customer = await db.customers.get(id);
            if (!customer || !customer.uuid) return;

            if (customer.outstandingBalance > 0) {
                throw new Error("Impossible de supprimer un client avec une dette existante.");
            }

            // Soft delete payments
            const paymentsToDelete = await db.payments.where('customerId').equals(id).toArray();
            for (const payment of paymentsToDelete) {
                if (payment.uuid) {
                    await db.payments.update(payment.id!, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
                    await syncService.queueSyncOperation('payments', payment.uuid, 'delete', {});
                }
            }

            // Soft delete customer
            await db.customers.update(id, { sync_status: 'pending_delete', updatedAt: new Date(), last_modified_by: syncService.getLocalDeviceId() });
            await syncService.queueSyncOperation('customers', customer.uuid, 'delete', {});
        });
    }

    async analyzeCustomerImport(data: any[]): Promise<ImportAnalysis> {
        const analysis: ImportAnalysis = { customersToAdd: [], customersToUpdate: [], skippedRows: [], errorRows: [], totalRows: data.length };
        const existingCustomers = await db.customers.where('sync_status').notEqual('pending_delete').toArray();
        
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

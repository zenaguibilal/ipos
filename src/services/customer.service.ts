
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

    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        const customer = await db.customers.where({ uuid }).first();
        if (customer?.sync_status === 'pending_delete') return undefined;
        return customer;
    }
    
    async getCustomerActivity(customerUuid: string, page: number = 1, pageSize: number = 10): Promise<(Sale | Payment | ProductReturn)[]> {
        const offset = (page - 1) * pageSize;

        // 1. Fetch only keys and dates
        const salesKeys = await db.sales.where({ customerUuid }).and(s => s.sync_status !== 'pending_delete').toArray(r => ({ id: r.id, date: r.createdAt, type: 'sale' }));
        const paymentsKeys = await db.payments.where({ customerUuid }).and(p => p.sync_status !== 'pending_delete').toArray(r => ({ id: r.id, date: r.paymentDate, type: 'payment' }));
        const returnsKeys = await db.returns.where({ customerUuid }).and(r => r.sync_status !== 'pending_delete').toArray(r => ({ id: r.id, date: r.createdAt, type: 'return' }));

        // 2. Merge, sort, and paginate keys
        const allKeys = [...salesKeys, ...paymentsKeys, ...returnsKeys]
            .sort((a, b) => b.date!.getTime() - a.date!.getTime())
            .slice(offset, offset + pageSize);

        // 3. Bulk fetch full records for the paginated keys
        const salesToFetch = allKeys.filter(k => k.type === 'sale').map(k => k.id!);
        const paymentsToFetch = allKeys.filter(k => k.type === 'payment').map(k => k.id!);
        const returnsToFetch = allKeys.filter(k => k.type === 'return').map(k => k.id!);
        
        const [sales, payments, returns] = await Promise.all([
            db.sales.bulkGet(salesToFetch),
            db.payments.bulkGet(paymentsToFetch),
            db.returns.bulkGet(returnsToFetch)
        ]);
        
        // 4. Merge full records and sort again (to maintain order)
        const activity = [
            ...sales.filter(Boolean).map(s => ({ ...s, type: 'sale', date: s!.createdAt!, id: `sale-${s!.id}` })),
            ...payments.filter(Boolean).map(p => ({ ...p, type: 'payment', date: p!.paymentDate, id: `payment-${p!.id}` })),
            ...returns.filter(Boolean).map(r => ({ ...r, type: 'return', date: r!.createdAt!, id: `return-${r!.id}` })),
        ];

        return activity.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer, unpaidSales: Sale[]}> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer) throw new Error("Client non trouvé");
        const unpaidSales = await db.sales
            .where('customerUuid').equals(customerUuid)
            .and(sale => sale.paymentStatus !== 'paid' && sale.sync_status !== 'pending_delete')
            .orderBy('createdAt').toArray();
        return { customer, unpaidSales };
    }

    async getCustomers(params: { query?: string, status?: string } = {}): Promise<Customer[]> {
        let collection;

        if (params.status === 'overdue') {
            collection = db.customers.where({ debtStatus: 'overdue' });
        } else if (params.status === 'over_limit') {
            collection = db.customers.where({ isOverLimit: 1 });
        } else {
            collection = db.customers.toCollection();
        }

        collection = collection.and(c => c.sync_status !== 'pending_delete');

        if (params.status === 'has_debt') {
            collection = collection.filter(c => c.outstandingBalance > 0);
        }
        
        if (params.query) {
            const q = params.query.toLowerCase();
            const byName = await collection.clone().filter(c => c.searchName?.toLowerCase().includes(q)).toArray();
            const byPhone = await collection.clone().filter(c => c.phone?.includes(q)).toArray();
            
            const combined = [...byName, ...byPhone];
            const uniqueIds = new Set();
            return combined.filter(element => {
                const isDuplicate = uniqueIds.has(element.id);
                uniqueIds.add(element.id);
                return !isDuplicate;
            }).sort((a, b) => (b.lastActivityDate?.getTime() ?? 0) - (a.lastActivityDate?.getTime() ?? 0));
        }
        
        return await collection.orderBy('lastActivityDate').reverse().toArray();
    }

    async addCustomer(customer: Omit<Customer, 'id' | 'uuid' | 'totalSpent' | 'outstandingBalance' | 'lastActivityDate'>): Promise<Customer> {
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
        await db.transaction('rw', db.customers, db.sales, db.payments, db.returns, db.sync_queue, async () => {
            const customer = await db.customers.get(id);
            if (!customer || !customer.uuid) return;

            const salesCount = await db.sales.where('customerUuid').equals(customer.uuid).and(s => s.sync_status !== 'pending_delete').count();
            if (salesCount > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de ventes.");
            }
            
            const paymentsCount = await db.payments.where('customerUuid').equals(customer.uuid).and(s => s.sync_status !== 'pending_delete').count();
            if (paymentsCount > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de paiements.");
            }

            const returnsCount = await db.returns.where('customerUuid').equals(customer.uuid).and(s => s.sync_status !== 'pending_delete').count();
            if (returnsCount > 0) {
                throw new Error("Impossible de supprimer un client avec un historique de retours.");
            }

            if (customer.outstandingBalance !== 0) {
                throw new Error("Impossible de supprimer un client avec un solde non nul.");
            }
            
            // Soft delete customer - no need to soft-delete related items as we've checked they don't exist
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

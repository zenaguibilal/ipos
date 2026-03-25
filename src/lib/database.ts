import Dexie, { type EntityTable } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, Cart, Draft, CompanyProfile, Expense, InventoryLog, Supplier, BreadClient, BreadOrder, SyncQueueItem } from '@/lib/types';

class iPOSDatabase extends Dexie {
    products!: EntityTable<Product, 'id'>;
    customers!: EntityTable<Customer, 'id'>;
    sales!: EntityTable<Sale, 'id'>;
    payments!: EntityTable<Payment, 'id'>;
    stockIntakes!: EntityTable<StockIntake, 'id'>;
    returns!: EntityTable<ProductReturn, 'id'>;
    carts!: EntityTable<Cart, 'id'>;
    drafts!: EntityTable<Draft, 'id'>;
    companyProfile!: EntityTable<CompanyProfile, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    inventoryLogs!: EntityTable<InventoryLog, 'id'>;
    suppliers!: EntityTable<Supplier, 'id'>;
    clients_pain!: EntityTable<BreadClient, 'id'>;
    commandes_pain!: EntityTable<BreadOrder, 'id'>;
    sync_queue!: EntityTable<SyncQueueItem, 'id'>;

    constructor() {
        super('iPOSDatabase');
        this.version(1).stores({
            products: '++id, *barcodes, name, category, fournisseurId, createdAt',
            customers: '++id, &searchName, phone, debtStatus, createdAt',
            sales: '++id, &invoiceNumber, customerId, createdAt',
            payments: '++id, customerId, paymentDate',
            stockIntakes: '++id, supplierId, invoiceDate, createdAt',
            returns: '++id, originalSaleId, customerId, createdAt',
            carts: 'id',
            drafts: '++id, createdAt',
            companyProfile: 'id',
            expenses: '++id, category, expenseDate',
            suppliers: '++id, &name',
            clients_pain: '++id, nom',
            commandes_pain: '++id, client_pain_id, date, &[client_pain_id+date]',
        });
        
        this.version(2).stores({
            customers: '++id, &searchName, phone, debtStatus, createdAt, lastActivityDate'
        });
        
        this.version(3).stores({
             products: '++id, *barcodes, name, category, fournisseurId, createdAt, price, quantity'
        });
        
        this.version(4).stores({
            inventoryLogs: '++id, productId, reason, createdAt',
            settings: null
        });
        
        this.version(5).stores({
            products: '++id, &uuid, *barcodes, name, category, fournisseurId, createdAt, price, quantity, sync_status, updatedAt',
            customers: '++id, &uuid, &searchName, phone, debtStatus, createdAt, lastActivityDate, sync_status, updatedAt',
            sales: '++id, &uuid, &invoiceNumber, customerId, createdAt, sync_status, updatedAt',
            payments: '++id, &uuid, customerId, paymentDate, sync_status, updatedAt',
            stockIntakes: '++id, &uuid, supplierId, invoiceDate, createdAt, sync_status, updatedAt',
            returns: '++id, &uuid, originalSaleId, customerId, createdAt, sync_status, updatedAt',
            expenses: '++id, &uuid, category, expenseDate, sync_status, updatedAt',
            suppliers: '++id, &uuid, &name, sync_status, updatedAt',
            clients_pain: '++id, &uuid, nom, sync_status, updatedAt',
            commandes_pain: '++id, &uuid, client_pain_id, date, &[client_pain_id+date], sync_status, updatedAt',
            companyProfile: 'id, &uuid, sync_status, updatedAt',
            inventoryLogs: '++id, &uuid, productId, reason, createdAt, sync_status, updatedAt',
            sync_queue: '++id, createdAt',
        });
        
        this.version(6).stores({
            products: '++id, &uuid, *barcodes, name, category, supplierUuid, createdAt, price, quantity, sync_status, updatedAt',
            sales: '++id, &uuid, &invoiceNumber, customerUuid, createdAt, sync_status, updatedAt, clientPainUuid',
            payments: '++id, &uuid, customerUuid, paymentDate, sync_status, updatedAt',
            stockIntakes: '++id, &uuid, supplierUuid, invoiceDate, createdAt, sync_status, updatedAt',
            returns: '++id, &uuid, originalSaleId, customerUuid, createdAt, sync_status, updatedAt',
            commandes_pain: '++id, &uuid, clientPainUuid, date, &[clientPainUuid+date], sync_status, updatedAt',
        }).upgrade(async tx => {
            console.log("Upgrading to version 6: Migrating foreign keys to UUIDs.");

            const customerMap = new Map<number, string>();
            await tx.table('customers').each(c => { if(c.id && c.uuid) customerMap.set(c.id, c.uuid) });

            const supplierMap = new Map<number, string>();
            await tx.table('suppliers').each(s => { if(s.id && s.uuid) supplierMap.set(s.id, s.uuid) });
            
            const breadClientMap = new Map<number, string>();
            await tx.table('clients_pain').each(bc => { if(bc.id && bc.uuid) breadClientMap.set(bc.id, bc.uuid) });

            await tx.table('products').toCollection().modify(p => {
                if (p.fournisseurId && supplierMap.has(p.fournisseurId)) {
                    p.supplierUuid = supplierMap.get(p.fournisseurId);
                }
                delete p.fournisseurId;
            });

            await tx.table('sales').toCollection().modify(s => {
                if (s.customerId && customerMap.has(s.customerId)) {
                    s.customerUuid = customerMap.get(s.customerId);
                }
                if (s.clientPainId && breadClientMap.has(s.clientPainId)) {
                    s.clientPainUuid = breadClientMap.get(s.clientPainId);
                }
                delete s.customerId;
                delete s.clientPainId;
            });

            await tx.table('payments').toCollection().modify(p => {
                if (p.customerId && customerMap.has(p.customerId)) {
                    p.customerUuid = customerMap.get(p.customerId);
                }
                delete p.customerId;
            });
            
            await tx.table('stockIntakes').toCollection().modify(si => {
                if (si.supplierId && supplierMap.has(si.supplierId)) {
                    si.supplierUuid = supplierMap.get(si.supplierId);
                }
                delete si.supplierId;
            });

            await tx.table('returns').toCollection().modify(r => {
                if (r.customerId && customerMap.has(r.customerId)) {
                    r.customerUuid = customerMap.get(r.customerId);
                }
                delete r.customerId;
            });

            await tx.table('commandes_pain').toCollection().modify(cp => {
                if (cp.client_pain_id && breadClientMap.has(cp.client_pain_id)) {
                    cp.clientPainUuid = breadClientMap.get(cp.client_pain_id);
                }
                delete cp.client_pain_id;
            });
        });
    }
}

export const db = new iPOSDatabase();

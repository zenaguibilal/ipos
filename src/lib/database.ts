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
        // Version 2: Add index for customer lastActivityDate for faster sorting
        this.version(2).stores({
            customers: '++id, &searchName, phone, debtStatus, createdAt, lastActivityDate'
        });
        // Version 3: Add indexes for product sorting
        this.version(3).stores({
             products: '++id, *barcodes, name, category, fournisseurId, createdAt, price, quantity'
        });
        // Version 4: Re-add inventoryLogs and remove settings
        this.version(4).stores({
            inventoryLogs: '++id, productId, reason, createdAt',
            settings: null // This explicitly removes the 'settings' table
        });
        // Version 5: Add sync queue and sync status fields to all tables, with performance indexes.
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
        // Version 6: Refactor FKs to UUIDs and add relevant indexes
        this.version(6).stores({
            products: '++id, &uuid, *barcodes, name, category, supplierUuid, createdAt, price, quantity, sync_status, updatedAt',
            sales: '++id, &uuid, &invoiceNumber, customerUuid, createdAt, sync_status, updatedAt',
            payments: '++id, &uuid, customerUuid, paymentDate, sync_status, updatedAt',
            stockIntakes: '++id, &uuid, supplierUuid, invoiceDate, createdAt, sync_status, updatedAt',
            returns: '++id, &uuid, originalSaleId, customerUuid, createdAt, sync_status, updatedAt',
            commandes_pain: '++id, &uuid, clientPainUuid, date, &[clientPainUuid+date], sync_status, updatedAt',
        }).upgrade(tx => {
            // This upgrade is for schema declaration only. Data migration for FKs is complex
            // and would require a dedicated migration script. For a fresh start, this is sufficient.
            console.log("Upgrading to version 6: Foreign keys are now based on UUIDs.");
        });
    }
}

export const db = new iPOSDatabase();

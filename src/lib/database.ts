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
            products: '++id, &uuid, *barcodes, name, category, supplierUuid, createdAt, updatedAt, price, quantity, sync_status',
            customers: '++id, &uuid, &searchName, phone, debtStatus, isOverLimit, createdAt, updatedAt, lastActivityDate, sync_status',
            sales: '++id, &uuid, &invoiceNumber, customerUuid, clientPainUuid, createdAt, updatedAt, sync_status',
            payments: '++id, &uuid, customerUuid, paymentDate, createdAt, updatedAt, sync_status',
            stockIntakes: '++id, &uuid, supplierUuid, invoiceDate, createdAt, updatedAt, sync_status',
            returns: '++id, &uuid, originalSaleId, customerUuid, createdAt, updatedAt, sync_status',
            carts: 'id', // Local only
            drafts: '++id, createdAt', // Local only
            companyProfile: 'id, &uuid, sync_status, updatedAt',
            expenses: '++id, &uuid, category, expenseDate, createdAt, updatedAt, sync_status',
            inventoryLogs: '++id, &uuid, productId, reason, createdAt, updatedAt, sync_status',
            suppliers: '++id, &uuid, &name, createdAt, updatedAt, sync_status',
            clients_pain: '++id, &uuid, nom, createdAt, updatedAt, sync_status',
            commandes_pain: '++id, &uuid, clientPainUuid, date, &[clientPainUuid+date], createdAt, updatedAt, sync_status',
            sync_queue: '++id, createdAt', // Local only
        });
    }
}

export const db = new iPOSDatabase();

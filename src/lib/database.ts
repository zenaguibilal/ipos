import Dexie, { type EntityTable, type Transaction } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, Cart, Draft, CompanyProfile, Expense, InventoryLog, Supplier, BreadClient, BreadOrder, SyncQueueItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { calculateStockStatus } from './utils';

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
        this.version(5).stores({
            products: '++id, &uuid, *barcodes, name, category, supplierUuid, createdAt, updatedAt, price, quantity, stockStatus, sync_status',
            customers: '++id, &uuid, &searchName, phone, debtStatus, isOverLimit, createdAt, updatedAt, lastActivityDate, sync_status',
            sales: '++id, &uuid, &invoiceNumber, customerUuid, createdAt, updatedAt, sync_status',
            payments: '++id, &uuid, customerUuid, paymentDate, createdAt, updatedAt, sync_status',
            stockIntakes: '++id, &uuid, supplierUuid, invoiceDate, createdAt, updatedAt, sync_status',
            returns: '++id, &uuid, originalSaleId, customerUuid, createdAt, updatedAt, sync_status',
            carts: 'id',
            drafts: '++id, createdAt',
            companyProfile: 'id, &uuid, sync_status, updatedAt',
            expenses: '++id, &uuid, category, expenseDate, createdAt, updatedAt, sync_status',
            inventoryLogs: '++id, &uuid, productId, reason, createdAt',
            suppliers: '++id, &uuid, &name, createdAt, updatedAt, sync_status',
            clients_pain: '++id, &uuid, nom, createdAt, updatedAt, sync_status',
            commandes_pain: '++id, &uuid, clientPainUuid, date, &[clientPainUuid+date], createdAt, updatedAt, sync_status',
            sync_queue: '++id, createdAt',
        }).upgrade(tx => {
            return tx.table('products').toCollection().modify(product => {
                product.stockStatus = calculateStockStatus(product.quantity, product.minStockLevel);
            });
        });

        this.version(4).stores({
            products: '++id, &uuid, *barcodes, name, category, supplierUuid, createdAt, updatedAt, price, quantity, sync_status',
            customers: '++id, &uuid, &searchName, phone, debtStatus, createdAt, updatedAt, lastActivityDate, sync_status',
            sales: '++id, &uuid, &invoiceNumber, customerUuid, createdAt, updatedAt, sync_status',
            payments: '++id, &uuid, customerUuid, paymentDate, createdAt, updatedAt, sync_status',
            stockIntakes: '++id, &uuid, supplierUuid, invoiceDate, createdAt, updatedAt, sync_status',
            returns: '++id, &uuid, originalSaleId, customerUuid, createdAt, updatedAt, sync_status',
            carts: 'id',
            drafts: '++id, createdAt',
            companyProfile: 'id, &uuid, sync_status, updatedAt',
            expenses: '++id, &uuid, category, expenseDate, createdAt, updatedAt, sync_status',
            inventoryLogs: '++id, &uuid, productId, reason, createdAt',
            suppliers: '++id, &uuid, &name, createdAt, updatedAt, sync_status',
            clients_pain: '++id, &uuid, nom, createdAt, updatedAt, sync_status',
            commandes_pain: '++id, &uuid, clientPainUuid, date, &[clientPainUuid+date], createdAt, updatedAt, sync_status',
            sync_queue: '++id, createdAt',
        }).upgrade(tx => {
            console.log("Running Dexie schema migration to version 4: Switching foreign keys to UUIDs.");
            return Promise.all([
                tx.table('sales').toCollection().modify(async (sale: Sale) => {
                    if ((sale as any).customerId && !sale.customerUuid) {
                        const customer = await tx.table('customers').get((sale as any).customerId);
                        if (customer) sale.customerUuid = customer.uuid;
                    }
                    if ((sale as any).clientPainId && !sale.clientPainUuid) {
                         const clientPain = await tx.table('clients_pain').get((sale as any).clientPainId);
                         if (clientPain) sale.clientPainUuid = clientPain.uuid;
                    }
                }),
                tx.table('payments').toCollection().modify(async (payment: Payment) => {
                    if ((payment as any).customerId && !payment.customerUuid) {
                        const customer = await tx.table('customers').get((payment as any).customerId);
                        if (customer) payment.customerUuid = customer.uuid;
                    }
                }),
                 tx.table('returns').toCollection().modify(async (pr: ProductReturn) => {
                    if ((pr as any).customerId && !pr.customerUuid) {
                        const customer = await tx.table('customers').get((pr as any).customerId);
                        if (customer) pr.customerUuid = customer.uuid;
                    }
                }),
                tx.table('stockIntakes').toCollection().modify(async (intake: StockIntake) => {
                    if ((intake as any).supplierId && !intake.supplierUuid) {
                        const supplier = await tx.table('suppliers').get((intake as any).supplierId);
                        if (supplier) intake.supplierUuid = supplier.uuid;
                    }
                }),
                 tx.table('products').toCollection().modify(async (product: Product) => {
                    if ((product as any).fournisseurId && !product.supplierUuid) {
                        const supplier = await tx.table('suppliers').get((product as any).fournisseurId);
                        if (supplier) product.supplierUuid = supplier.uuid;
                    }
                }),
                tx.table('commandes_pain').toCollection().modify(async (order: BreadOrder) => {
                    if ((order as any).client_pain_id && !order.clientPainUuid) {
                        const clientPain = await tx.table('clients_pain').get((order as any).client_pain_id);
                        if (clientPain) order.clientPainUuid = clientPain.uuid;
                    }
                })
            ]);
        });
    }
}

export const db = new iPOSDatabase();

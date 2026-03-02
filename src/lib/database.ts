import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, Cart, CompanyProfile, BreadCustomer, DailyBreadOrder, Expense, Setting, Notification, InventoryLog } from './types';

export class PosDatabase extends Dexie {
    products!: Table<Product, number>;
    customers!: Table<Customer, number>;
    sales!: Table<Sale, number>;
    payments!: Table<Payment, number>;
    stockIntakes!: Table<StockIntake, number>;
    returns!: Table<ProductReturn, number>;
    carts!: Table<Cart, string>;
    companyProfile!: Table<CompanyProfile, number>;
    breadCustomers!: Table<BreadCustomer, number>;
    dailyBreadOrders!: Table<DailyBreadOrder, number>;
    expenses!: Table<Expense, number>;
    settings!: Table<Setting, string>;
    notifications!: Table<Notification, number>;
    inventoryLogs!: Table<InventoryLog, number>;

    constructor() {
        super('posDB');
        this.version(18).stores({
            products: '++id, name, *barcodes, category, price, quantity, [category+name]',
            customers: '++id, createdAt, [lastName+firstName], outstandingBalance, lastActivityDate',
            sales: '++id, &invoiceNumber, createdAt, customerId, customerName, paymentStatus, breadOrderDate',
            payments: '++id, createdAt, customerId',
            stockIntakes: '++id, &invoiceNumber, supplier, createdAt',
            returns: '++id, createdAt, originalSaleId, customerId',
            carts: '&id',
            companyProfile: 'id', // Singleton table
            breadCustomers: '++id, &name',
            dailyBreadOrders: '++id, &[breadCustomerId+date], date',
            expenses: '++id, category, expenseDate, [category+expenseDate]',
            settings: '&id', // Key-value store for UI state and preferences
            notifications: '++id, createdAt, isRead, type, [type+isRead]',
            inventoryLogs: '++id, productId, createdAt, reason',
        });

        // Hooks to add/update timestamps
        this.tables.forEach(table => {
            if (['settings', 'carts'].includes(table.name)) return;
            
            table.hook('creating', (primKey, obj, trans) => {
                const now = new Date();
                if ((obj as any).createdAt === undefined) {
                    (obj as any).createdAt = now;
                }
                if ((obj as any).updatedAt === undefined && table.name !== 'inventoryLogs') {
                    (obj as any).updatedAt = now;
                }
            });

            table.hook('updating', (modifications, primKey, obj, trans) => {
                if((modifications as any).updatedAt === undefined) {
                    (modifications as any).updatedAt = new Date();
                }
            });
        });
    }
}

export const db = new PosDatabase();

import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, Cart, CompanyProfile, BreadCustomer, DailyBreadOrder, Expense, Setting, Notification, InventoryLog, Draft } from './types';

export class PosDatabase extends Dexie {
    products!: Table<Product, number>;
    customers!: Table<Customer, number>;
    sales!: Table<Sale, number>;
    payments!: Table<Payment, number>;
    stockIntakes!: Table<StockIntake, number>;
    returns!: Table<ProductReturn, number>;
    carts!: Table<Cart, string>;
    drafts!: Table<Draft, number>;
    companyProfile!: Table<CompanyProfile, number>;
    breadCustomers!: Table<BreadCustomer, number>;
    dailyBreadOrders!: Table<DailyBreadOrder, number>;
    expenses!: Table<Expense, number>;
    settings!: Table<Setting, string>;
    notifications!: Table<Notification, number>;
    inventoryLogs!: Table<InventoryLog, number>;

    constructor() {
        super('posDB');
        this.version(23).stores({
            products: '++id, name, *barcodes, category, price, quantity, [category+name]',
            customers: '++id, searchName, createdAt, lastName, firstName, [lastName+firstName], phone, outstandingBalance, lastActivityDate',
            sales: '++id, &invoiceNumber, createdAt, customerId, customerName, paymentStatus, breadOrderDate, dueDate',
            payments: '++id, createdAt, customerId',
            stockIntakes: '++id, &invoiceNumber, supplier, createdAt',
            returns: '++id, createdAt, originalSaleId, customerId',
            carts: '&id',
            drafts: '++id, date',
            companyProfile: 'id', // Singleton table
            breadCustomers: '++id, &name',
            dailyBreadOrders: '++id, &[breadCustomerId+date], date',
            expenses: '++id, category, expenseDate, [category+expenseDate]',
            settings: '&id', // Key-value store for UI state and preferences
            notifications: '++id, createdAt, isRead, type, [type+isRead]',
            inventoryLogs: '++id, productId, createdAt, reason',
        }).upgrade(tx => {
            // Dexie upgrade functions are declarative of the target version structure.
            // This is for version 22, ensuring searchName is populated. It runs if the client db version is < 22.
            return tx.table('customers').toCollection().modify(customer => {
                if (customer.firstName && customer.lastName && !customer.searchName) {
                   customer.searchName = `${customer.firstName.toLowerCase()} ${customer.lastName.toLowerCase()}`;
                }
            });
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
        
        // Hooks to auto-generate searchName for customers
        this.customers.hook('creating', (primKey, obj) => {
            if(typeof obj.firstName === 'string' && typeof obj.lastName === 'string') {
                obj.searchName = `${obj.firstName.toLowerCase()} ${obj.lastName.toLowerCase()}`;
            }
        });

        this.customers.hook('updating', (modifications, primKey, obj) => {
            if (Object.hasOwn(modifications, 'firstName') || Object.hasOwn(modifications, 'lastName')) {
                const newFirstName = Object.hasOwn(modifications, 'firstName') ? (modifications as any).firstName : obj.firstName;
                const newLastName = Object.hasOwn(modifications, 'lastName') ? (modifications as any).lastName : obj.lastName;
                if (typeof newFirstName === 'string' && typeof newLastName === 'string') {
                    (modifications as any).searchName = `${newFirstName.toLowerCase()} ${newLastName.toLowerCase()}`;
                }
            }
        });
    }
}

export const db = new PosDatabase();

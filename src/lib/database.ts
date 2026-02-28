import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, CompanyProfile, BreadCustomer, DailyBreadOrder, Cart, Expense } from './types';

export class PosDatabase extends Dexie {
    products!: Table<Product, number>;
    customers!: Table<Customer, number>;
    sales!: Table<Sale, number>;
    payments!: Table<Payment, number>;
    stockIntakes!: Table<StockIntake, number>;
    returns!: Table<ProductReturn, number>;
    companyProfile!: Table<CompanyProfile, number>;
    breadCustomers!: Table<BreadCustomer, number>;
    dailyBreadOrders!: Table<DailyBreadOrder, number>;
    carts!: Table<Cart, string>;
    expenses!: Table<Expense, number>;

    constructor() {
        super('posDB');
        this.version(4).stores({
            products: '++id, name, *barcodes, category',
            customers: '++id, phone, *lastName, *firstName',
            sales: '++id, &invoiceNumber, customerId, createdAt, breadOrderDate',
            payments: '++id, customerId, createdAt',
            stockIntakes: '++id, &invoiceNumber, supplier, createdAt',
            returns: '++id, originalInvoiceNumber, customerId, createdAt',
            companyProfile: 'id', // Singleton table
            breadCustomers: '++id, &name',
            dailyBreadOrders: '++id, &[breadCustomerId+date], date',
            carts: '&id, name',
            expenses: '++id, category, expenseDate'
        });

        // Hooks pour ajouter/mettre à jour les timestamps
        this.tables.forEach(table => {
            // Do not add timestamps to carts table
            if (table.name === 'carts') return;
            
            table.hook('creating', (primKey, obj, trans) => {
                const now = new Date();
                if ((obj as any).createdAt === undefined) {
                    (obj as any).createdAt = now;
                }
                if ((obj as any).updatedAt === undefined) {
                    (obj as any).updatedAt = now;
                }
            });

            table.hook('updating', (modifications, primKey, obj, trans) => {
                // In an updating hook, you can modify the modifications object to be applied.
                (modifications as any).updatedAt = new Date();
            });
        });
    }
}

export const db = new PosDatabase();

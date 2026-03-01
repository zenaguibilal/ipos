import Dexie, { type Table } from 'dexie';
import type { Product, Customer, StockIntake, CompanyProfile, BreadCustomer, DailyBreadOrder, Expense, Setting } from './types';

export class PosDatabase extends Dexie {
    products!: Table<Product, number>;
    customers!: Table<Customer, number>;
    stockIntakes!: Table<StockIntake, number>;
    companyProfile!: Table<CompanyProfile, number>;
    breadCustomers!: Table<BreadCustomer, number>;
    dailyBreadOrders!: Table<DailyBreadOrder, number>;
    expenses!: Table<Expense, number>;
    settings!: Table<Setting, string>;

    constructor() {
        super('posDB');
        this.version(8).stores({
            products: '++id, name, *barcodes, category',
            customers: '++id, phone, *lastName, *firstName',
            stockIntakes: '++id, &invoiceNumber, supplier, createdAt',
            companyProfile: 'id', // Singleton table
            breadCustomers: '++id, &name',
            dailyBreadOrders: '++id, &[breadCustomerId+date], date',
            expenses: '++id, category, expenseDate, [category+expenseDate]',
            settings: '&id', // Key-value store
        });

        // Hooks pour ajouter/mettre à jour les timestamps
        this.tables.forEach(table => {
            // Do not add timestamps to settings table
            if (table.name === 'settings') return;
            
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

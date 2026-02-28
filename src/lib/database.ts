import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, CompanyProfile, BreadCustomer, DailyBreadOrder } from './types';

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

    constructor() {
        super('posDB');
        this.version(2).stores({
            products: '++id, name, *barcodes, category',
            customers: '++id, phone, *lastName, *firstName',
            sales: '++id, &invoiceNumber, customerId, createdAt, breadOrderDate',
            payments: '++id, customerId, createdAt',
            stockIntakes: '++id, &invoiceNumber, supplier, createdAt',
            returns: '++id, originalInvoiceNumber, customerId, createdAt',
            companyProfile: 'id', // Singleton table
            breadCustomers: '++id, &name',
            dailyBreadOrders: '++id, &[breadCustomerId+date], date'
        });

        // Hooks pour ajouter/mettre à jour les timestamps
        this.on('creating', (primKey, obj, table) => {
            const now = new Date();
            if (typeof obj.createdAt === 'undefined') {
                obj.createdAt = now;
            }
            if (typeof obj.updatedAt === 'undefined') {
                obj.updatedAt = now;
            }
        });

        this.on('updating', (modifications, primKey, obj, table) => {
            // modifications est ce qui est passé à la méthode update.
            // On retourne un objet avec les modifications à appliquer.
            return {
                ...modifications,
                updatedAt: new Date(),
            };
        });
    }
}

export const db = new PosDatabase();

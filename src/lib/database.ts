import Dexie, { type EntityTable } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, Cart, Draft, CompanyProfile, Expense, Supplier, BreadClient, BreadOrder } from '@/lib/types';

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
    suppliers!: EntityTable<Supplier, 'id'>;
    clients_pain!: EntityTable<BreadClient, 'id'>;
    commandes_pain!: EntityTable<BreadOrder, 'id'>;

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
    }
}

export const db = new iPOSDatabase();

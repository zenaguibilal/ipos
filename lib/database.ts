import Dexie, { type Table } from 'dexie';
import type { Product, Customer, Sale, Payment, StockIntake, ProductReturn, Cart, CompanyProfile, Expense, Setting, Notification, InventoryLog, Draft, Supplier, BreadClient, BreadOrder } from './types';

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
    expenses!: Table<Expense, number>;
    settings!: Table<Setting, string>;
    notifications!: Table<Notification, number>;
    inventoryLogs!: Table<InventoryLog, number>;
    suppliers!: Table<Supplier, number>;
    clients_pain!: Table<BreadClient, number>;
    commandes_pain!: Table<BreadOrder, number>;

    constructor() {
        super('posDB');
        this.version(29).stores({
            products: '++id, name, *barcodes, category, price, quantity, [category+name], fournisseurId',
            customers: '++id, searchName, createdAt, lastName, firstName, [lastName+firstName], phone, outstandingBalance, lastActivityDate',
            sales: '++id, &invoiceNumber, createdAt, customerId, customerName, paymentStatus, dueDate',
            payments: '++id, createdAt, customerId, paymentDate',
            stockIntakes: '++id, &invoiceNumber, supplierId, createdAt',
            returns: '++id, createdAt, originalSaleId, customerId',
            carts: '&id',
            drafts: '++id, date',
            companyProfile: 'id', // Singleton table
            expenses: '++id, category, expenseDate, [category+expenseDate]',
            settings: '&id', // Key-value store for UI state and preferences
            notifications: '++id, createdAt, isRead, type, [type+isRead]',
            inventoryLogs: '++id, productId, createdAt, reason',
            suppliers: '++id, &name',
            clients_pain: '++id, nom, actif, type_recurrence',
            commandes_pain: '++id, [client_pain_id+date], date, est_paye, est_livre',
        }).upgrade(tx => {
            // Dexie upgrade functions are declarative of the target version structure.
            // This is for version 22, ensuring searchName is populated. It runs if the client db version is < 22.
            return tx.table('customers').toCollection().modify(customer => {
                if (customer.firstName && customer.lastName && !customer.searchName) {
                   customer.searchName = `${customer.firstName.toLowerCase()} ${customer.lastName.toLowerCase()}`;
                }
            });
        }).upgrade(tx => {
            // This is for version 28, migrating 'statut' to 'est_paye' and 'est_livre'
            return tx.table('commandes_pain').toCollection().modify(order => {
                const oldStatut = (order as any).statut;
                if (oldStatut !== undefined) {
                    switch(oldStatut) {
                        case 'en_attente':
                            order.est_paye = false;
                            order.est_livre = false;
                            break;
                        case 'livre':
                            order.est_paye = false;
                            order.est_livre = true;
                            break;
                        case 'paye':
                            order.est_paye = true;
                            order.est_livre = true; 
                            break;
                        default:
                            order.est_paye = !!order.vente_id;
                            order.est_livre = false;
                    }
                    delete (order as any).statut;
                }
            });
        }).upgrade(async tx => {
            const stockIntakesToMigrate = await tx.table('stockIntakes').toArray();
            for (const intake of stockIntakesToMigrate) {
                if (typeof (intake as any).supplier === 'string') {
                    const supplierName = (intake as any).supplier;
                    let supplier = await tx.table('suppliers').where('name').equalsIgnoreCase(supplierName).first();
                    if (!supplier) {
                        const supplierId = await tx.table('suppliers').add({ name: supplierName, balance: 0 });
                        supplier = { id: supplierId, name: supplierName };
                    }
                    await tx.table('stockIntakes').update(intake.id, {
                        supplierId: supplier.id,
                        supplierName: supplier.name,
                        supplier: undefined
                    });
                }
            }
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

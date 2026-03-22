'use client';

import { TABLES, type TableName } from './types';

const DB_NAME = 'iPOS_DB_NATIVE';
const DB_VERSION = 2; // Incremented version to trigger upgrade

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
        // This is a server-side mock. It will never resolve.
        return new Promise(() => {});
    }
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const tx = (event.target as IDBOpenDBRequest).transaction;

            Object.values(TABLES).forEach(tableName => {
                let store: IDBObjectStore;
                if (!db.objectStoreNames.contains(tableName)) {
                    let keyPath = 'id';
                    let autoIncrement = true;
                    if (['carts', 'settings'].includes(tableName)) {
                        autoIncrement = false;
                    } else if (tableName === 'companyProfile') {
                        autoIncrement = false;
                    }
                    store = db.createObjectStore(tableName, { keyPath, autoIncrement });
                } else {
                    store = tx!.objectStore(tableName);
                }

                // Add indexes based on old Dexie schema for performance
                switch (tableName) {
                    case 'products':
                        if (!store.indexNames.contains('name')) store.createIndex('name', 'name', { unique: false });
                        if (!store.indexNames.contains('barcodes')) store.createIndex('barcodes', 'barcodes', { multiEntry: true });
                        if (!store.indexNames.contains('category')) store.createIndex('category', 'category', { unique: false });
                        if (!store.indexNames.contains('fournisseurId')) store.createIndex('fournisseurId', 'fournisseurId', { unique: false });
                        if (!store.indexNames.contains('category_name')) store.createIndex('category_name', ['category', 'name'], { unique: false });
                        break;
                    case 'customers':
                        if (!store.indexNames.contains('searchName')) store.createIndex('searchName', 'searchName', { unique: false });
                        if (!store.indexNames.contains('lastName')) store.createIndex('lastName', 'lastName', { unique: false });
                        if (!store.indexNames.contains('firstName')) store.createIndex('firstName', 'firstName', { unique: false });
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('phone')) store.createIndex('phone', 'phone', { unique: false });
                        if (!store.indexNames.contains('outstandingBalance')) store.createIndex('outstandingBalance', 'outstandingBalance', { unique: false });
                        if (!store.indexNames.contains('lastActivityDate')) store.createIndex('lastActivityDate', 'lastActivityDate', { unique: false });
                        if (!store.indexNames.contains('lastName_firstName')) store.createIndex('lastName_firstName', ['lastName', 'firstName'], { unique: false });
                        break;
                    case 'sales':
                        if (!store.indexNames.contains('invoiceNumber')) store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('customerId')) store.createIndex('customerId', 'customerId', { unique: false });
                        if (!store.indexNames.contains('customerName')) store.createIndex('customerName', 'customerName', { unique: false });
                        if (!store.indexNames.contains('paymentStatus')) store.createIndex('paymentStatus', 'paymentStatus', { unique: false });
                        if (!store.indexNames.contains('dueDate')) store.createIndex('dueDate', 'dueDate', { unique: false });
                        break;
                    case 'payments':
                        if (!store.indexNames.contains('customerId')) store.createIndex('customerId', 'customerId', { unique: false });
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('paymentDate')) store.createIndex('paymentDate', 'paymentDate', { unique: false });
                        break;
                    case 'stockIntakes':
                        if (!store.indexNames.contains('supplierId')) store.createIndex('supplierId', 'supplierId', { unique: false });
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('invoiceNumber')) store.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
                        break;
                    case 'returns':
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('originalSaleId')) store.createIndex('originalSaleId', 'originalSaleId', { unique: false });
                        if (!store.indexNames.contains('customerId')) store.createIndex('customerId', 'customerId', { unique: false });
                        break;
                    case 'drafts':
                         if (!store.indexNames.contains('date')) store.createIndex('date', 'date', { unique: false });
                         if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                         if (!store.indexNames.contains('updatedAt')) store.createIndex('updatedAt', 'updatedAt', { unique: false });
                        break;
                    case 'expenses':
                         if (!store.indexNames.contains('expenseDate')) store.createIndex('expenseDate', 'expenseDate', { unique: false });
                         if (!store.indexNames.contains('category')) store.createIndex('category', 'category', { unique: false });
                         if (!store.indexNames.contains('category_expenseDate')) store.createIndex('category_expenseDate', ['category', 'expenseDate'], { unique: false });
                        break;
                    case 'inventoryLogs':
                        if (!store.indexNames.contains('productId')) store.createIndex('productId', 'productId', { unique: false });
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('reason')) store.createIndex('reason', 'reason', { unique: false });
                        break;
                    case 'suppliers':
                        if (!store.indexNames.contains('name')) store.createIndex('name', 'name', { unique: true });
                        break;
                    case 'clients_pain':
                        if (!store.indexNames.contains('actif')) store.createIndex('actif', 'actif', { unique: false });
                        break;
                    case 'commandes_pain':
                        if (!store.indexNames.contains('date')) store.createIndex('date', 'date', { unique: false });
                        if (!store.indexNames.contains('client_pain_id')) store.createIndex('client_pain_id', 'client_pain_id', { unique: false });
                        if (!store.indexNames.contains('client_pain_id_date')) store.createIndex('client_pain_id_date', ['client_pain_id', 'date'], { unique: false });
                        if (!store.indexNames.contains('est_paye')) store.createIndex('est_paye', 'est_paye', { unique: false });
                        if (!store.indexNames.contains('est_livre')) store.createIndex('est_livre', 'est_livre', { unique: false });
                        break;
                    case 'notifications':
                        if (!store.indexNames.contains('createdAt')) store.createIndex('createdAt', 'createdAt', { unique: false });
                        if (!store.indexNames.contains('isRead')) store.createIndex('isRead', 'isRead', { unique: false });
                        if (!store.indexNames.contains('type')) store.createIndex('type', 'type', { unique: false });
                        if (!store.indexNames.contains('type_isRead')) store.createIndex('type_isRead', ['type', 'isRead'], { unique: false });
                        break;
                }
            });
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
            dbPromise = null;
        };
    });

    return dbPromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

async function getAll<T>(table: TableName): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(table, 'readonly');
  const store = tx.objectStore(table);
  return promisify<T[]>(store.getAll());
}

async function getById<T>(table: TableName, id: IDBValidKey): Promise<T | undefined> {
  if (id === undefined || id === null) return undefined;
  const db = await openDB();
  const tx = db.transaction(table, 'readonly');
  const store = tx.objectStore(table);
  return promisify<T>(store.get(id));
}

async function add<T extends { id?: IDBValidKey }>(table: TableName, item: Omit<T, 'id'>): Promise<T> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  const now = new Date();
  const newItem = {
    ...item,
    createdAt: (item as any).createdAt ?? now,
    updatedAt: now,
  };
  const id = await promisify<IDBValidKey>(store.add(newItem));
  await promisify(tx.done);
  return { ...newItem, id } as T;
}

async function update<T>(table: TableName, id: IDBValidKey, changes: Partial<T>): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  const existing = await promisify<any>(store.get(id));
  if (!existing) return undefined;
  const updated = {
    ...existing,
    ...changes,
    id: existing.id,
    updatedAt: new Date(),
  };
  await promisify(store.put(updated));
  await promisify(tx.done);
  return updated as T;
}

async function put(table: TableName, item: any): Promise<any> {
    const db = await openDB();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    const id = await promisify(store.put(item));
    await promisify(tx.done);
    return { ...item, id };
}

async function remove(table: TableName, id: IDBValidKey): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  await promisify(store.delete(id));
  await promisify(tx.done);
}

async function removeMultiple(table: TableName, ids: IDBValidKey[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await openDB();
    const tx = db.transaction(table, 'readwrite');
    const store = tx.objectStore(table);
    for (const id of ids) {
        store.delete(id);
    }
    await promisify(tx.done);
}


async function where<T>(table: TableName, indexName: string, value: any): Promise<T[]> {
  const db = await openDB();
  const store = db.transaction(table, 'readonly').objectStore(table);
  if (!store.indexNames.contains(indexName)) {
    console.warn(`Index '${indexName}' does not exist on table '${table}'. Performing a full table scan.`);
    const allItems = await getAll<any>(table);
    return allItems.filter(item => {
        const itemValue = item[indexName];
        if (Array.isArray(itemValue)) {
            return itemValue.includes(value);
        }
        return itemValue === value;
    });
  }
  const index = store.index(indexName);
  return promisify(index.getAll(value));
}

async function clearTable(table: TableName): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  await promisify(tx.objectStore(table).clear());
  await promisify(tx.done);
}

async function resetDatabase(): Promise<void> {
    const db = dbPromise ? await dbPromise : null;
    if (db) {
        db.close();
    }
    await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
            dbPromise = null;
            resolve();
        };
        deleteRequest.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
        deleteRequest.onblocked = () => {
            console.warn("Delete blocked");
            reject(new Error("La suppression de la base de données est bloquée."));
        }
    });
}

export const db = {
    open: openDB,
    promisify,
    getAll,
    getById,
    add,
    update,
    put,
    remove,
    removeMultiple,
    where,
    clearTable,
    resetDatabase,
    transaction: async (tables: TableName[], mode: IDBTransactionMode) => {
        const db = await openDB();
        return db.transaction(tables, mode);
    }
};

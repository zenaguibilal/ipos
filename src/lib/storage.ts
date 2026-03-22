'use client';

import { TABLES, type TableName } from './types';

const DB_NAME = 'iPOS_DB_NATIVE';
const DB_VERSION = 1;

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

            Object.values(TABLES).forEach(tableName => {
                if (!db.objectStoreNames.contains(tableName)) {
                    let keyPath = 'id';
                    let autoIncrement = true;
                    if (['carts', 'settings'].includes(tableName)) {
                        autoIncrement = false;
                    } else if (tableName === 'companyProfile') {
                        autoIncrement = false;
                    }
                    
                    const store = db.createObjectStore(tableName, { keyPath, autoIncrement });

                    switch (tableName) {
                        case 'products':
                            store.createIndex('name', 'name', { unique: false });
                            if (!store.indexNames.contains('barcodes')) store.createIndex('barcodes', 'barcodes', { multiEntry: true });
                            store.createIndex('category', 'category', { unique: false });
                            store.createIndex('fournisseurId', 'fournisseurId', { unique: false });
                            break;
                        case 'customers':
                            store.createIndex('searchName', 'searchName', { unique: false });
                            store.createIndex('lastName', 'lastName', { unique: false });
                            store.createIndex('firstName', 'firstName', { unique: false });
                            break;
                        case 'sales':
                            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
                            store.createIndex('createdAt', 'createdAt', { unique: false });
                            store.createIndex('customerId', 'customerId', { unique: false });
                            break;
                        case 'payments':
                            store.createIndex('customerId', 'customerId', { unique: false });
                            break;
                        case 'stockIntakes':
                            store.createIndex('supplierId', 'supplierId', { unique: false });
                            break;
                        case 'expenses':
                             store.createIndex('expenseDate', 'expenseDate', { unique: false });
                             store.createIndex('category', 'category', { unique: false });
                            break;
                        case 'inventoryLogs':
                            store.createIndex('productId', 'productId', { unique: false });
                            break;
                        case 'suppliers':
                            store.createIndex('name', 'name', { unique: true });
                            break;
                        case 'clients_pain':
                            store.createIndex('actif', 'actif', { unique: false });
                            break;
                        case 'commandes_pain':
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('client_pain_id', 'client_pain_id', { unique: false });
                            break;
                    }
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
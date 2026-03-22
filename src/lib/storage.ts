'use client';

/**
 * ╔══════════════════════════════════════════════════╗
 * ║  iPOS — طبقة التخزين المركزية                   ║
 * ║  IndexedDB مباشرة بدون Dexie                    ║
 * ║  هذا الملف الوحيد المسموح فيه بـ IndexedDB     ║
 * ╚══════════════════════════════════════════════════╝
 */

import { TABLES, type TableName } from './types';

const DB_NAME = 'iPOS';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
        // This is a server-side mock. It will never resolve, which is fine
        // because it should never be called on the server.
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
                    const isAutoIncrement = !['carts', 'settings', 'companyProfile'].includes(tableName);
                    const store = db.createObjectStore(tableName, {
                        keyPath: 'id',
                        autoIncrement: isAutoIncrement,
                    });

                    // Define indexes for each table
                    switch (tableName) {
                        case 'products':
                            store.createIndex('name', 'name', { unique: false });
                            store.createIndex('category', 'category', { unique: false });
                            store.createIndex('barcodes_idx', 'barcodes', { multiEntry: true });
                            break;
                        case 'customers':
                            store.createIndex('searchName', 'searchName', { unique: false });
                            store.createIndex('lastName', 'lastName', { unique: false });
                            store.createIndex('firstName', 'firstName', { unique: false });
                            break;
                        case 'sales':
                            store.createIndex('customerId', 'customerId', { unique: false });
                            store.createIndex('paymentStatus', 'paymentStatus', { unique: false });
                            store.createIndex('createdAt', 'createdAt', { unique: false });
                            store.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
                            break;
                        case 'payments':
                            store.createIndex('customerId', 'customerId', { unique: false });
                            break;
                        case 'stockIntakes':
                            store.createIndex('supplierId', 'supplierId', { unique: false });
                            break;
                        case 'expenses':
                            store.createIndex('category', 'category', { unique: false });
                            store.createIndex('expenseDate', 'expenseDate', { unique: false });
                            break;
                        case 'notifications':
                            store.createIndex('isRead', 'isRead', { unique: false });
                            store.createIndex('type', 'type', { unique: false });
                            break;
                        case 'inventoryLogs':
                            store.createIndex('productId', 'productId', { unique: false });
                            break;
                        case 'suppliers':
                            store.createIndex('name', 'name', { unique: true });
                            break;
                        case 'clients_pain':
                            store.createIndex('actif', 'actif', { unique: false });
                            store.createIndex('type_recurrence', 'type_recurrence', { unique: false });
                            break;
                        case 'commandes_pain':
                            store.createIndex('date', 'date', { unique: false });
                            store.createIndex('est_paye', 'est_paye', { unique: false });
                            store.createIndex('est_livre', 'est_livre', { unique: false });
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

export function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror  = () => reject(request.error);
  });
}

// --- Basic CRUD ---

export async function getAll<T>(table: TableName): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(table, 'readonly');
  const store = tx.objectStore(table);
  return promisify<T[]>(store.getAll());
}

export async function getById<T>(table: TableName, id: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(table, 'readonly');
  const store = tx.objectStore(table);
  return promisify<T>(store.get(id));
}

export async function add<T extends { id?: IDBValidKey }>(table: TableName, item: Omit<T, 'id'>): Promise<T> {
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
  return { ...newItem, id } as T;
}

export async function update<T extends { id: IDBValidKey }>(table: TableName, id: IDBValidKey, changes: Partial<T>): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  const existing = await promisify<T>(store.get(id));
  if (!existing) return undefined;
  const updated = {
    ...existing,
    ...changes,
    updatedAt: new Date(),
  };
  await promisify(store.put(updated));
  return updated;
}

export async function remove(table: TableName, id: IDBValidKey): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  const store = tx.objectStore(table);
  await promisify(store.delete(id));
}

export async function where<T>(table: TableName, indexName: string, value: any): Promise<T[]> {
  const db = await openDB();
  const store = db.transaction(table).objectStore(table);
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

export async function clearTable(table: TableName): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(table, 'readwrite');
  await promisify(tx.objectStore(table).clear());
}

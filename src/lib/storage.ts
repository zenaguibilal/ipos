'use client';

/**
 * ╔══════════════════════════════════════════════════╗
 * ║  iPOS — طبقة التخزين المركزية                   ║
 * ║  IndexedDB مباشرة بدون Dexie                    ║
 * ║  هذا الملف الوحيد المسموح فيه بـ IndexedDB     ║
 * ╚══════════════════════════════════════════════════╝
 */

const DB_NAME    = 'iPOS'
const DB_VERSION = 1

export const TABLES = {
  products:       'products',
  customers:      'customers',
  sales:          'sales',
  payments:       'payments',
  stockIntakes:   'stockIntakes',
  returns:        'returns',
  carts:          'carts',
  drafts:         'drafts',
  companyProfile: 'companyProfile',
  expenses:       'expenses',
  settings:       'settings',
  notifications:  'notifications',
  inventoryLogs:  'inventoryLogs',
  suppliers:      'suppliers',
  clients_pain:   'clients_pain',
  commandes_pain: 'commandes_pain',
} as const

export type TableName = keyof typeof TABLES

// ─── فتح قاعدة البيانات ───────────────────────────
let _db: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {

    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available on server'))
      return
    }

    if (_db) {
      resolve(_db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      Object.values(TABLES).forEach(tableName => {
        if (!db.objectStoreNames.contains(tableName)) {
           const isAutoIncrement = !['carts', 'settings', 'companyProfile'].includes(tableName);
          const store = db.createObjectStore(tableName, {
            keyPath: 'id',
            autoIncrement: isAutoIncrement,
          })

          switch (tableName) {
            case 'products':
              store.createIndex('name',     'name',     { unique: false })
              store.createIndex('category', 'category', { unique: false })
              break
            case 'customers':
              store.createIndex('phone',     'phone',     { unique: false })
              store.createIndex('lastName',  'lastName',  { unique: false })
              store.createIndex('firstName', 'firstName', { unique: false })
              break
            case 'sales':
              store.createIndex('customerId',    'customerId',    { unique: false })
              store.createIndex('paymentStatus', 'paymentStatus', { unique: false })
              store.createIndex('createdAt',     'createdAt',     { unique: false })
              break
            case 'payments':
              store.createIndex('customerId', 'customerId', { unique: false })
              break
            case 'stockIntakes':
              store.createIndex('supplierId', 'supplierId', { unique: false })
              break
            case 'expenses':
              store.createIndex('category',    'category',    { unique: false })
              store.createIndex('expenseDate', 'expenseDate', { unique: false })
              break
            case 'notifications':
              store.createIndex('isRead', 'isRead', { unique: false })
              store.createIndex('type',   'type',   { unique: false })
              break
            case 'inventoryLogs':
              store.createIndex('productId', 'productId', { unique: false })
              break
            case 'suppliers':
              store.createIndex('name', 'name', { unique: true })
              break
            case 'clients_pain':
              store.createIndex('actif',           'actif',           { unique: false })
              store.createIndex('type_recurrence', 'type_recurrence', { unique: false })
              break
            case 'commandes_pain':
              store.createIndex('date',          'date',          { unique: false })
              store.createIndex('est_paye',      'est_paye',      { unique: false })
              store.createIndex('est_livre',     'est_livre',     { unique: false })
              store.createIndex('client_pain_id','client_pain_id',{ unique: false })
              break
          }
        }
      })
    }

    request.onsuccess = (event) => {
      _db = (event.target as IDBOpenDBRequest).result
      resolve(_db)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

// ─── دالة مساعدة للـ Transaction ─────────────────
async function getStore(
  tableName: TableName,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const db = await openDB()
  const tx = db.transaction(tableName, mode)
  return tx.objectStore(tableName)
}

// ─── تحويل IDBRequest إلى Promise ────────────────
function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror  = () => reject(request.error)
  })
}

// ─── CRUD الأساسي ─────────────────────────────────

export async function getAll<T>(table: TableName): Promise<T[]> {
  const store = await getStore(table)
  return promisify<T[]>(store.getAll())
}

export async function getById<T>(
  table: TableName,
  id: IDBValidKey
): Promise<T | undefined> {
  const store = await getStore(table)
  return promisify<T>(store.get(id))
}

export async function add<T extends { id?: IDBValidKey }>(
  table: TableName,
  item: Omit<T, 'id'>
): Promise<T> {
  const store = await getStore(table, 'readwrite')
  const now = new Date().toISOString()
  const newItem = {
    ...item,
    createdAt: (item as any).createdAt ?? now,
    updatedAt: now,
  }
  const id = await promisify<IDBValidKey>(
    store.add(newItem)
  )
  return { ...newItem, id } as unknown as T
}

export async function update<T extends { id: IDBValidKey }>(
  table: TableName,
  id: IDBValidKey,
  changes: Partial<T>
): Promise<T | undefined> {
  const store = await getStore(table, 'readwrite')
  const existing = await promisify<T>(store.get(id))
  if (!existing) return undefined
  const updated = {
    ...existing,
    ...changes,
    id,
    updatedAt: new Date().toISOString(),
  }
  await promisify(store.put(updated))
  return updated
}

export async function remove(
  table: TableName,
  id: IDBValidKey
): Promise<void> {
  const store = await getStore(table, 'readwrite')
  await promisify(store.delete(id))
}

export async function bulkAdd<T extends { id?: IDBValidKey }>(
  table: TableName,
  items: Omit<T, 'id'>[]
): Promise<T[]> {
  const db = await openDB()
  const tx = db.transaction(table, 'readwrite')
  const store = tx.objectStore(table)
  const now = new Date().toISOString()
  const results: T[] = []

  for (const item of items) {
    const newItem = {
      ...item,
      createdAt: (item as any).createdAt ?? now,
      updatedAt: now,
    }
    const id = await promisify<IDBValidKey>(
      store.add(newItem)
    )
    results.push({ ...newItem, id } as unknown as T)
  }

  return results
}

export async function bulkPut<T extends { id: IDBValidKey }>(
  table: TableName,
  items: T[]
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(table, 'readwrite')
  const store = tx.objectStore(table)
  const now = new Date().toISOString()

  for (const item of items) {
    await promisify(store.put({ ...item, updatedAt: now }))
  }
}

export async function clearTable(table: TableName): Promise<void> {
  const store = await getStore(table, 'readwrite')
  await promisify(store.clear())
}

export async function whereEqual<T>(
  table: TableName,
  indexName: string,
  value: unknown
): Promise<T[]> {
  const db = await openDB()
  const tx = db.transaction(table, 'readonly')
  const store = tx.objectStore(table)

  if (store.indexNames.contains(indexName)) {
    const index = store.index(indexName)
    return promisify<T[]>(
      index.getAll(value as IDBValidKey)
    )
  }

  const all = await promisify<T[]>(store.getAll())
  return all.filter(item => (item as any)[indexName] === value)
}

export async function count(table: TableName): Promise<number> {
  const store = await getStore(table)
  return promisify<number>(store.count())
}

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const backup: Record<string, unknown[]> = {}
  for (const table of Object.keys(TABLES) as TableName[]) {
    backup[table] = await getAll(table)
  }
  return backup
}

export async function importAllData(
  data: Record<string, unknown[]>
): Promise<void> {
  for (const table of Object.keys(TABLES) as TableName[]) {
    if (data[table]?.length > 0) {
      await clearTable(table)
      await bulkPut(table, data[table] as any[])
    }
  }
}

export async function clearAllData(): Promise<void> {
  for (const table of Object.keys(TABLES) as TableName[]) {
    await clearTable(table)
  }
}

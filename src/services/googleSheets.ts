

'use client';

import { dataService } from '@/services/data-service';
import type { CompanyProfile, TableName } from '@/lib/types';
import { TABLES } from '@/lib/types';
import { getDb } from '@/lib/database';

const SYNC_QUEUE_KEY = 'ipos_sync_queue';

// Define which tables are eligible for a full sync
export const TABLES_TO_SYNC: TableName[] = [
    'products', 'customers', 'suppliers',
    'sales', 'stockIntakes', 'returns',
    'payments', 'expenses', 'drafts',
    'inventoryLogs', 'clients_pain', 'commandes_pain',
    'companyProfile', 'settings', 'notifications'
];

interface QueueItem {
    id: number;
    table: string;
    action: 'upsert' | 'delete';
    record: any;
    attempts: number;
}

class GoogleSheetsService {
  scriptUrl: string | null = null;
  isOnline: boolean = false;
  initialized: boolean = false;

  constructor() {}

  init() {
    if (typeof window === 'undefined' || this.initialized) {
        return;
    }
    this.initialized = true;
    this.isOnline = navigator.onLine;
    this.loadScriptUrl();

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Process queue on initial load if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  async loadScriptUrl() {
    try {
      const profile = await dataService.getCompanyProfile();
      this.scriptUrl = profile?.syncUrl || null;
      if (this.scriptUrl) {
        this.processSyncQueue();
      }
    } catch { 
      // This might happen if DB is not ready, it's ok.
      this.scriptUrl = null;
    }
  }

  async sendToSheets(table: string, action: 'upsert' | 'delete', record: any) {
    if (!this.scriptUrl) throw new Error("Sync URL not configured.");
    if (!this.isOnline) throw new Error("Offline. Cannot send to sheets.");

    // Using 'text/plain' for no-cors POST requests
    const response = await fetch(this.scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      body: JSON.stringify({ table, action, record }),
      headers: { 'Content-Type': 'text/plain' }
    });
    
    // For no-cors, we can't inspect the response, so we optimistically assume success
    if (response.type === 'opaque') {
        return { success: true };
    }

    // This block would only run if the server has CORS headers, which is not the case for Google Apps Script web apps by default.
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Sync request failed');
    }
    return result;
  }
  
  async fetchFromSheets(table: string): Promise<any[]> {
    if (!this.scriptUrl || !this.isOnline) return [];
    
    const fetchUrl = new URL(this.scriptUrl);
    fetchUrl.searchParams.append('table', table);

    const response = await fetch(fetchUrl.toString());
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch from sheets, status: ${response.status}. Error: ${errorText}`);
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.error || `Unknown error fetching table ${table}`);
    return result.records || [];
  }
  
  async syncTable(tableName: TableName) {
    if (!this.isOnline || !this.scriptUrl) {
      throw new Error("Pas de connexion ou URL de script non configurée.");
    }
    // 'carts' is transient and should not be synced.
    if (!Object.values(TABLES).includes(tableName as any) || ['carts'].includes(tableName)) {
      return { success: true, message: `Tableau ignoré: ${tableName}` };
    }

    const db = getDb();
    const table = db.table(tableName);

    // 1. Fetch remote records from Google Sheets
    const remoteRecords = await this.fetchFromSheets(tableName);
    if (!Array.isArray(remoteRecords)) {
        throw new Error(`Données invalides reçues pour le tableau: ${tableName}`);
    }

    // 2. Get local record IDs
    const localIds = (await table.toCollection().keys());
    const remoteIds = new Set(remoteRecords.map((r: any) => r.id));

    // 3. Determine which local records to delete (stale records).
    const idsToDelete = localIds.filter(id => !remoteIds.has(id));

    // 4. Perform DB operations in a single atomic transaction
    await db.transaction('rw', table, async () => {
      if (idsToDelete.length > 0) {
        await table.bulkDelete(idsToDelete as any[]); // Cast to any[] to handle mixed string/number keys
      }
      if (remoteRecords.length > 0) {
        await table.bulkPut(remoteRecords);
      }
    });

    return {
      success: true,
      deleted: idsToDelete.length,
      upserted: remoteRecords.length,
    };
  }

  async fullSync() {
    if (!this.isOnline || !this.scriptUrl) {
      throw new Error("Pas de connexion internet ou l'URL du script n'est pas configurée.");
    }

    const results: { [key: string]: any } = {};
    for (const table of TABLES_TO_SYNC) {
      try {
        results[table] = await this.syncTable(table);
      } catch (e: any) {
        console.error(`La synchronisation a échoué pour le tableau ${table}:`, e);
        results[table] = { success: false, error: e.message };
      }
    }
    const lastSync = new Date().toISOString();
    await dataService.updateCompanyProfile({ lastSyncDate: lastSync });
    return { success: true, results, lastSync };
  }

  addToQueue(table: string, action: 'upsert' | 'delete', record: any) {
    if(!record.id && (action === 'upsert' || action === 'delete')){
      console.warn("Attempted to queue record without ID.", {table, action, record});
      return;
    }
    if (this.isOnline && this.scriptUrl) {
      this.sendToSheets(table, action, record).catch(e => {
        console.warn('Live sync failed, adding to queue.', e);
        this.pushToQueue({ id: Date.now(), table, action, record, attempts: 0 });
      });
      return;
    }
    this.pushToQueue({ id: Date.now(), table, action, record, attempts: 0 });
  }
  
  private pushToQueue(item: QueueItem) {
    try {
        const queue = this.loadQueue();
        const existingIndex = queue.findIndex(i => i.table === item.table && i.record.id === item.record.id);
        if (existingIndex > -1) {
            queue[existingIndex] = item;
        } else {
            queue.push(item);
        }
        this.saveQueue(queue);
    } catch(e) {
        console.error("Failed to push to sync queue", e);
    }
  }

  async processSyncQueue() {
    if (!this.isOnline || !this.scriptUrl) return;
    let queue = this.loadQueue();
    if (queue.length === 0) return;
    
    const remainingItems: QueueItem[] = [];

    for (const item of queue) {
      try {
        await this.sendToSheets(item.table, item.action, item.record);
      } catch {
        item.attempts++;
        if (item.attempts < 3) {
            remainingItems.push(item);
        }
      }
    }
    this.saveQueue(remainingItems);
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      hasScriptUrl: !!this.scriptUrl,
      pendingItems: this.loadQueue().length
    };
  }

  loadQueue(): QueueItem[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const stored = localStorage.getItem(SYNC_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }

  saveQueue(queue: QueueItem[]) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch(e) {
       console.error("Failed to save sync queue", e);
    }
  }
}

export const sheetsService = new GoogleSheetsService();

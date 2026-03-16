'use client';

import { db, PosDatabase } from '@/lib/database';

const SYNC_QUEUE_KEY = 'ipos_sync_queue';

export const TABLES_TO_SYNC: (keyof PosDatabase)[] = [
  'products', 'customers', 'suppliers',
  'sales', 'stockIntakes', 'returns',
  'payments', 'expenses', 'drafts',
  'inventoryLogs', 'clients_pain', 'commandes_pain',
  'companyProfile', 'settings'
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

  constructor() {
    // Constructor must be safe to run on the server
  }

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
    
    // Initial processing in case we start online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  async loadScriptUrl() {
    try {
      const profile = await db.companyProfile.get(1);
      this.scriptUrl = profile?.syncUrl || null;
      if (this.scriptUrl) {
        this.processSyncQueue();
      }
    } catch { 
      this.scriptUrl = null;
    }
  }

  async sendToSheets(table: string, action: 'upsert' | 'delete', record: any) {
    if (!this.scriptUrl || !this.isOnline) return;

    // Use 'no-cors' for simple requests to Apps Script web apps deployed to be accessible by anyone
    const response = await fetch(this.scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      body: JSON.stringify({ table, action, record }),
      headers: { 'Content-Type': 'text/plain' } // Use text/plain for no-cors
    });
    
    // For 'no-cors' requests, we can't read the response body. We assume success if the request doesn't throw.
    if (response.type === 'opaque') {
        return { success: true };
    }

    // If not opaque, we might be able to read it (e.g., same-origin or proper CORS setup)
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Sync request failed');
    }
    return result;
  }

  async fetchFromSheets(table: string): Promise<any[]> {
    if (!this.scriptUrl || !this.isOnline) return [];

    const response = await fetch(`${this.scriptUrl}?table=${table}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.records || [];
  }
  
  async syncTable(table: string) {
    if (!TABLES_TO_SYNC.includes(table as any)) {
      return { success: true, message: 'Skipped' };
    }
    const localRecords = await db.table(table).toArray();
    const remoteRecords = await this.fetchFromSheets(table);

    const localMap = new Map(localRecords.map((r: any) => [String(r.id), r]));
    const remoteMap = new Map(remoteRecords.map((r: any) => [String(r.id), r]));

    const toUpdateLocal: any[] = [];
    const toUpdateRemote: any[] = [];
    const toAddLocal: any[] = [];
    const toAddRemote: any[] = [];
    let noChange = 0;

    for (const [id, local] of localMap.entries()) {
      const remote = remoteMap.get(id);
      if (!remote) {
        toAddRemote.push(local);
      } else {
        const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
        const remoteTime = new Date(remote.updated_at || remote.created_at || 0).getTime();

        if (remoteTime > localTime) {
          toUpdateLocal.push(remote);
        } else if (localTime > remoteTime) {
          toUpdateRemote.push(local);
        } else {
          noChange++;
        }
      }
    }

    for (const [id, remote] of remoteMap.entries()) {
      if (!localMap.has(id)) {
        toAddLocal.push(remote);
      }
    }

    if (toUpdateLocal.length > 0) await db.table(table).bulkPut(toUpdateLocal);
    if (toAddLocal.length > 0) await db.table(table).bulkPut(toAddLocal);
    for (const record of [...toUpdateRemote, ...toAddRemote]) {
      await this.sendToSheets(table, 'upsert', record);
    }
    
    return {
      success: true, localUpdated: toUpdateLocal.length, localAdded: toAddLocal.length,
      remoteUpdated: toUpdateRemote.length, remoteAdded: toAddRemote.length, noChange
    };
  }

  async fullSync() {
    if (!this.isOnline || !this.scriptUrl) {
      throw new Error("Pas de connexion internet ou l'URL du script n'est pas configurée.");
    }

    const results: { [key: string]: any } = {};
    for (const table of TABLES_TO_SYNC) {
      if(['carts'].includes(table as string)) continue;
      try {
        results[table as string] = await this.syncTable(table as string);
      } catch (e: any) {
        results[table as string] = { success: false, error: e.message };
      }
    }
    const lastSync = new Date().toISOString();
    await db.companyProfile.where({id: 1}).modify({ lastSyncDate: lastSync });
    return { success: true, results, lastSync };
  }

  async addToQueue(table: string, action: 'upsert' | 'delete', record: any) {
    if (this.isOnline && this.scriptUrl) {
      try {
        await this.sendToSheets(table, action, record);
        return;
      } catch (e) {
        console.warn('Live sync failed, adding to queue.', e);
      }
    }
    const queue = this.loadQueue();
    queue.push({ id: Date.now(), table, action, record, attempts: 0 });
    this.saveQueue(queue);
  }

  async processSyncQueue() {
    if (!this.isOnline || !this.scriptUrl) return;

    const queue = this.loadQueue();
    if (queue.length === 0) return;

    const processedIds: number[] = [];

    for (const item of queue) {
      try {
        await this.sendToSheets(item.table, item.action, item.record);
        processedIds.push(item.id);
      } catch {
        item.attempts++;
        if (item.attempts >= 3) {
          processedIds.push(item.id);
        }
      }
    }

    if (processedIds.length > 0) {
      this.saveQueue(queue.filter(i => !processedIds.includes(i.id)));
    }
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
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }
}

export const sheetsService = new GoogleSheetsService();

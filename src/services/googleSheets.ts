
'use client';

import { dataService } from '@/services/data-service';
import type { CompanyProfile, TableName } from '@/lib/types';
import { TABLES } from '@/lib/types';

const SYNC_QUEUE_KEY = 'ipos_sync_queue';

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
      this.scriptUrl = null;
    }
  }

  async sendToSheets(table: string, action: 'upsert' | 'delete', record: any) {
    if (!this.scriptUrl) return;

    const response = await fetch(this.scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      body: JSON.stringify({ table, action, record }),
      headers: { 'Content-Type': 'text/plain' }
    });
    
    if (response.type === 'opaque') {
        return { success: true };
    }

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
  
  async syncTable(tableName: TableName) {
    if (!Object.values(TABLES).includes(tableName)) {
        return { success: true, message: 'Skipped' };
    }
    const localRecords = await dataService.getAll(tableName);
    const remoteRecords = await this.fetchFromSheets(tableName);

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
        const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();

        if (remoteTime > localTime) toUpdateLocal.push(remote);
        else if (localTime > remoteTime) toUpdateRemote.push(local);
        else noChange++;
      }
    }
    for (const [id, remote] of remoteMap.entries()) {
      if (!localMap.has(id)) toAddLocal.push(remote);
    }
    
    // Applying changes needs to be done carefully via dataService to trigger logic
    if (toUpdateLocal.length > 0) {
        for(const record of toUpdateLocal) {
          if(record.id) await dataService.update(tableName as any, record.id, record);
        }
    }
     if (toAddLocal.length > 0) {
         for(const record of toAddLocal) await dataService.add(tableName as any, record);
     }
    for (const record of [...toUpdateRemote, ...toAddRemote]) {
      await this.sendToSheets(tableName, 'upsert', record);
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
    await dataService.updateCompanyProfile({ lastSyncDate: lastSync });
    return { success: true, results, lastSync };
  }

  addToQueue(table: string, action: 'upsert' | 'delete', record: any) {
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
    const queue = this.loadQueue();
    queue.push(item);
    this.saveQueue(queue);
  }

  async processSyncQueue() {
    if (!this.isOnline || !this.scriptUrl) return;
    const queue = this.loadQueue();
    if (queue.length === 0) return;
    let success = true;
    for (const item of queue) {
      try {
        await this.sendToSheets(item.table, item.action, item.record);
      } catch {
        item.attempts++;
        success = false;
      }
    }
    const newQueue = queue.filter(item => item.attempts < 3);
    this.saveQueue(newQueue);
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

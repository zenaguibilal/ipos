'use client';

import { db } from '@/lib/database';
import type { CompanyProfile } from '@/lib/types';

const SYNC_QUEUE_KEY = 'ipos_sync_queue';

export const TABLES_TO_SYNC: (keyof typeof db)[] = [
  'products', 'customers', 'sales', 'payments', 
  'stockIntakes', 'returns', 'expenses', 'settings', 
  'inventoryLogs', 'suppliers', 'clients_pain', 'commandes_pain',
  'companyProfile', 'drafts'
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
  isOnline: boolean;

  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.loadScriptUrl();
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.isOnline = true;
          this.processSyncQueue();
        });
        window.addEventListener('offline', () => {
          this.isOnline = false;
        });
    }
  }

  async loadScriptUrl() {
    try {
      const profile = await db.companyProfile.get(1);
      this.scriptUrl = profile?.syncUrl || null;
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
    
    if (response.type === 'opaque' || response.ok) {
        return { success: true };
    }

    throw new Error('Sync request failed');
  }

  async fetchFromSheets(table: string): Promise<any[]> {
    if (!this.scriptUrl) return [];

    const response = await fetch(`${this.scriptUrl}?table=${table}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.records || [];
  }
  
  async syncTable(table: string) {
    const localRecords = await (db as any)[table].toArray();
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

    if (toUpdateLocal.length > 0) await (db as any)[table].bulkPut(toUpdateLocal);
    if (toAddLocal.length > 0) await (db as any)[table].bulkPut(toAddLocal);
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
      throw new Error('Pas de connexion internet ou Script URL non configuré');
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
    await this.loadScriptUrl();
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
    await this.loadScriptUrl();
    if (!this.isOnline || !this.scriptUrl) return;

    const queue = this.loadQueue();
    if (queue.length === 0) return;

    const processedIds: number[] = [];
    let remainingQueue = [...queue];

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

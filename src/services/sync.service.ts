'use client';
import { db } from '@/lib/database';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';

export class SyncService {
    private isSyncing = false;
    private localDeviceId: string;
    private supabase: SupabaseClient;

    constructor() {
        let deviceId = localStorage.getItem('localDeviceId');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('localDeviceId', deviceId);
        }
        this.localDeviceId = deviceId;
        this.supabase = createClient();
    }

    getLocalDeviceId(): string {
        return this.localDeviceId;
    }

    async queueSyncOperation(tableName: string, recordUuid: string, action: 'create' | 'update' | 'delete', payload: any) {
        await db.sync_queue.add({
            tableName,
            recordUuid,
            action,
            payload,
            createdAt: new Date(),
            attempts: 0,
        });
        
        if (navigator.onLine) {
            this.processPushQueue();
        }
    }

    async processPushQueue() {
        if (this.isSyncing || !navigator.onLine) return;
        this.isSyncing = true;
        
        const queueItems = await db.sync_queue.orderBy('createdAt').limit(100).toArray();
        if (queueItems.length === 0) {
            this.isSyncing = false;
            return;
        }

        toast.info(`Synchronisation de ${queueItems.length} modification(s) en cours...`);

        for (const item of queueItems) {
            try {
                let error;
                const payload = { ...item.payload, last_modified_by: this.localDeviceId };
                
                switch (item.action) {
                    case 'create':
                        ({ error } = await this.supabase.from(item.tableName).insert(payload));
                        break;
                    case 'update':
                        ({ error } = await this.supabase.from(item.tableName).update(payload).eq('uuid', item.recordUuid));
                        break;
                    case 'delete':
                        ({ error } = await this.supabase.from(item.tableName).delete().eq('uuid', item.recordUuid));
                        break;
                }

                if (error) throw error;
                
                await db.sync_queue.delete(item.id!);

                const table = (db as any)[item.tableName];
                const record = await table?.where('uuid').equals(item.recordUuid).first();

                if (record) {
                    if (item.action === 'delete') {
                        await table.delete(record.id);
                    } else {
                        await table.update(record.id, { sync_status: 'synced' });
                    }
                }

            } catch (e: any) {
                console.error('Sync error for item:', item, e);
                await db.sync_queue.update(item.id!, { attempts: (item.attempts || 0) + 1 });
            }
        }
        
        this.isSyncing = false;
        
        if (await db.sync_queue.count() > 0) {
            this.processPushQueue();
        } else {
             toast.success('Synchronisation terminée.');
        }
    }

    async pullChanges() {
        if (!navigator.onLine) return;
        
        for (const table of db.tables) {
            const tableName = table.name;
            if (tableName === 'sync_queue' || tableName === 'carts' || tableName === 'drafts') continue;
            
            const lastSyncedRecord = await (db as any)[tableName].orderBy('updatedAt').last();
            const lastSyncTime = lastSyncedRecord?.updatedAt || new Date(0);

            const { data, error } = await this.supabase
                .from(tableName)
                .select('*')
                .gt('updated_at', lastSyncTime.toISOString())
                .not('last_modified_by', 'eq', this.localDeviceId);

            if (error) {
                console.error(`Error pulling from ${tableName}`, error);
                continue;
            }
            
            if (data && data.length > 0) {
                 toast.info(`Réception de ${data.length} modification(s) de la table ${tableName}...`);
                 // Here, we use a simple "last write wins" by using bulkPut.
                 // A more robust system might need conflict resolution logic.
                 await (db as any)[tableName].bulkPut(data);
            }
        }
    }

    startSync() {
        window.addEventListener('online', () => {
            toast.success('Connexion rétablie. Synchronisation en cours...');
            this.processPushQueue();
            this.pullChanges();
        });
        window.addEventListener('offline', () => toast.warning('Connexion perdue. Passage en mode hors ligne.'));

        // Initial sync on load
        if (navigator.onLine) {
            this.processPushQueue();
            this.pullChanges();
        }
        
        // Periodically check for changes to sync
        setInterval(() => {
            if (navigator.onLine) {
                this.processPushQueue();
                this.pullChanges();
            }
        }, 5 * 60 * 1000); // Sync every 5 minutes
    }
}

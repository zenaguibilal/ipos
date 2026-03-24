// This is a simplified conceptual implementation for demonstration.
// A production-grade sync engine would require more robust error handling,
// conflict resolution strategies, and batching optimizations.

'use client';
import { db } from '@/lib/database';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export class SyncService {
    private isSyncing = false;
    private localDeviceId: string;

    constructor() {
        let deviceId = localStorage.getItem('localDeviceId');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('localDeviceId', deviceId);
        }
        this.localDeviceId = deviceId;
    }

    getLocalDeviceId(): string {
        return this.localDeviceId;
    }

    async queueSyncOperation(table_name: string, record_uuid: string, action: 'create' | 'update' | 'delete', payload: any) {
        await db.sync_queue.add({
            table_name,
            record_uuid,
            action,
            payload,
            created_at: new Date(),
            attempts: 0,
        });
        // Trigger sync immediately if online
        if (navigator.onLine) {
            this.processPushQueue();
        }
    }

    async processPushQueue() {
        if (this.isSyncing || !navigator.onLine) return;
        this.isSyncing = true;
        
        const queueItems = await db.sync_queue.orderBy('created_at').limit(100).toArray();
        if (queueItems.length === 0) {
            this.isSyncing = false;
            return;
        }

        toast.info(`Synchronisation de ${queueItems.length} modification(s) en cours...`);

        for (const item of queueItems) {
            try {
                let error;
                switch (item.action) {
                    case 'create':
                        ({ error } = await supabase.from(item.table_name).insert(item.payload));
                        break;
                    case 'update':
                        ({ error } = await supabase.from(item.table_name).update(item.payload).eq('uuid', item.record_uuid));
                        break;
                    case 'delete':
                        ({ error } = await supabase.from(item.table_name).delete().eq('uuid', item.record_uuid));
                        break;
                }

                if (error) {
                    throw error;
                }
                
                // If successful, remove from queue
                await db.sync_queue.delete(item.id!);

                // If it was a pending delete, we can now safely remove the local soft-deleted record
                if (item.action === 'delete') {
                    const recordInTable = await (db as any)[item.table_name].where('uuid').equals(item.record_uuid).first();
                    if (recordInTable) {
                        await (db as any)[item.table_name].delete(recordInTable.id);
                    }
                } else {
                     // Mark the local item as synced
                    await (db as any)[item.table_name].where('uuid').equals(item.record_uuid).modify({ sync_status: 'synced' });
                }

            } catch (e: any) {
                console.error('Sync error for item:', item, e);
                await db.sync_queue.update(item.id!, { attempts: (item.attempts || 0) + 1 });
            }
        }
        
        this.isSyncing = false;
        
        // If there are more items, process them
        if (await db.sync_queue.count() > 0) {
            this.processPushQueue();
        } else {
             toast.success('Synchronisation terminée.');
        }
    }

    // A simple pull strategy: "last write wins". More complex logic (e.g., CRDTs) is needed for true multi-master sync.
    async pullChanges() {
        if (!navigator.onLine) return;
        
        for (const table of db.tables) {
            if (table.name === 'sync_queue' || table.name === 'carts' || table.name === 'drafts') continue;
            
            const lastSyncedRecord = await table.orderBy('updated_at').last();
            const lastSyncTime = lastSyncedRecord?.updated_at || new Date(0);

            const { data, error } = await supabase
                .from(table.name)
                .select('*')
                .gt('updated_at', lastSyncTime.toISOString())
                .not('last_modified_by', 'eq', this.localDeviceId);

            if (error) {
                console.error(`Error pulling from ${table.name}`, error);
                continue;
            }
            
            if (data && data.length > 0) {
                 toast.info(`Réception de ${data.length} modification(s) de la table ${table.name}...`);
                 await (db as any)[table.name].bulkPut(data);
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

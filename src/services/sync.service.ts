'use client';
import { db } from '@/lib/database';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type SyncStatus = 'syncing' | 'online' | 'offline';

class SyncServiceSingleton {
    private isSyncing = false;
    private localDeviceId: string;
    private supabase: ReturnType<typeof createClient>;

    constructor() {
        let deviceId = localStorage.getItem('localDeviceId');
        if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem('localDeviceId', deviceId);
        }
        this.localDeviceId = deviceId;
        this.supabase = createClient();
        
        if(!this.supabase) {
            console.warn("Supabase URL or Key is not set in .env file. Sync functionality will be disabled.");
        } else {
            console.log("Supabase sync is enabled.");
        }
    }
    
    private _dispatchStatus() {
        let status: SyncStatus;
        if (!navigator.onLine) {
            status = 'offline';
        } else if (this.isSyncing) {
            status = 'syncing';
        } else {
            status = 'online';
        }
        window.dispatchEvent(new CustomEvent('syncStatusChange', { detail: status }));
    }

    getLocalDeviceId(): string {
        return this.localDeviceId;
    }

    private _toSnakeCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this._toSnakeCase(v));
        }
        if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
            return Object.keys(obj).reduce((acc, key) => {
                const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                acc[snakeKey] = this._toSnakeCase(obj[key]);
                return acc;
            }, {} as any);
        }
        return obj;
    }

    private _fromSnakeCase(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this._fromSnakeCase(v));
        }
        if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
            return Object.keys(obj).reduce((acc, key) => {
                const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
                acc[camelKey] = this._fromSnakeCase(obj[key]);
                return acc;
            }, {} as any);
        }
        return obj;
    }
    
    private async _syncNow() {
        if (!this.supabase || this.isSyncing || !navigator.onLine) {
            this._dispatchStatus();
            return;
        }

        this.isSyncing = true;
        this._dispatchStatus();
        toast.info('Synchronisation en cours...');

        try {
            await this._processPushQueue();
            await this._pullChanges();
             toast.success('Synchronisation terminée.');
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("La synchronisation a échoué.");
        } finally {
            this.isSyncing = false;
            this._dispatchStatus();
            const queueCount = await db.sync_queue.count();
            if (queueCount > 0 && navigator.onLine) {
                 setTimeout(() => this._syncNow(), 2000); // Rerun if items still in queue
            }
        }
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
        
        if (this.supabase) {
            setTimeout(() => this._syncNow(), 100);
        }
    }

    private async _processPushQueue() {
        if (!this.supabase) return;

        const queueItems = await db.sync_queue.orderBy('createdAt').limit(100).toArray();

        for (const item of queueItems) {
            try {
                let error;
                const remotePayload = this._toSnakeCase(item.payload);
                
                remotePayload.last_modified_by = this.localDeviceId;
                remotePayload.updated_at = new Date().toISOString();
                
                if (item.action === 'create' && !remotePayload.uuid) {
                    remotePayload.uuid = item.recordUuid;
                }

                switch (item.action) {
                    case 'create':
                        ({ error } = await this.supabase.from(item.tableName).insert(remotePayload));
                        break;
                    case 'update':
                        ({ error } = await this.supabase.from(item.tableName).update(remotePayload).eq('uuid', item.recordUuid));
                        break;
                    case 'delete':
                        ({ error } = await this.supabase.from(item.tableName).delete().eq('uuid', item.recordUuid));
                        break;
                }

                 if (error && error.code === '23505' && item.action === 'create') {
                     console.warn(`Sync race condition for ${item.tableName}:${item.recordUuid}. Converting to update.`);
                     delete remotePayload.uuid;
                     ({ error } = await this.supabase.from(item.tableName).update(remotePayload).eq('uuid', item.recordUuid));
                }

                if (error) throw error;
                
                await db.transaction('rw', db.sync_queue, (db as any)[item.tableName], async () => {
                    // Operation was successful, remove from queue
                    await db.sync_queue.delete(item.id!);
                
                    // If it wasn't a delete, mark the local item as 'synced'
                    if (item.action !== 'delete') {
                        const record = await (db as any)[item.tableName]?.where('uuid').equals(item.recordUuid).first();
                        if (record) {
                            await (db as any)[item.tableName].update(record.id, { sync_status: 'synced' });
                        }
                    }
                    // If it was a delete, we do nothing. The local record remains as a 'pending_delete' tombstone.
                });


            } catch (e: any) {
                console.error('Push sync error for item:', item, e);
                await db.sync_queue.update(item.id!, { attempts: (item.attempts || 0) + 1 });
            }
        }
    }

    private async _pullChanges() {
        if (!this.supabase) return;

        for (const tableDef of db.tables) {
            const tableName = tableDef.name;
            if (['sync_queue', 'carts', 'drafts'].includes(tableName)) continue;
            
            try {
                const lastSyncedRecord = await (db as any)[tableName].orderBy('updatedAt').last();
                const lastSyncTime = lastSyncedRecord?.updatedAt || new Date(0);

                const { data, error } = await this.supabase
                    .from(tableName)
                    .select('*')
                    .gt('updated_at', lastSyncTime.toISOString())
                    .not('last_modified_by', 'eq', this.localDeviceId);

                if (error) throw error;
                
                if (data && data.length > 0) {
                     const localData = data.map(record => this._fromSnakeCase(record));

                    const localPendingUuids = new Set(
                        (await (db as any)[tableName]
                            .where('sync_status').notEqual('synced')
                            .toArray())
                            .map((r: any) => r.uuid).filter(Boolean)
                    );

                    const safeDataToPut = localData.filter(
                        (remoteRecord: any) => !localPendingUuids.has(remoteRecord.uuid)
                    );

                    if (safeDataToPut.length > 0) {
                        console.log(`[Sync] Pulling ${safeDataToPut.length} new/updated records for table: ${tableName}`);
                        await (db as any)[tableName].bulkPut(safeDataToPut);
                    }
                }
            } catch (e) {
                console.error(`Error pulling from ${tableName}`, e);
            }
        }
    }

    startSync() {
        if (!this.supabase) {
            this._dispatchStatus();
            return;
        }

        window.addEventListener('online', () => {
            toast.success('Connexion rétablie.');
            this._dispatchStatus();
            this._syncNow();
        });
        window.addEventListener('offline', () => {
            toast.warning('Connexion perdue. Mode hors ligne activé.');
            this._dispatchStatus();
        });

        this._dispatchStatus();
        setTimeout(() => this._syncNow(), 1000);
        
        setInterval(() => this._syncNow(), 5 * 60 * 1000);
    }
}


export const syncService = new SyncServiceSingleton();

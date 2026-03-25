'use client';

import { db } from '@/lib/database';

export class BackupService {
    async exportData(): Promise<any> {
        const data: any = {};
        const tablesToExport = db.tables.filter(table => table.name !== 'carts' && table.name !== 'sync_queue');
        for (const table of tablesToExport) {
            data[table.name] = await table.toArray();
        }
        return data;
    }
    
    async restoreTables(data: any): Promise<void> {
        await db.transaction('rw', db.tables, async () => {
             const tablesToRestore = db.tables.filter(table => table.name !== 'carts');
            for (const table of tablesToRestore) {
                if (data[table.name]) {
                    await table.clear();
                    await table.bulkAdd(data[table.name]);
                }
            }
        });
    }

    async resetDatabase(): Promise<void> {
        await db.delete();
        await db.open();
    }
    
    async getDbStats(): Promise<{ products: number; customers: number; sales: number; } | null> {
        try {
            const counts = await Promise.all([
                db.products.count(),
                db.customers.count(),
                db.sales.count(),
            ]);
            return {
                products: counts[0],
                customers: counts[1],
                sales: counts[2],
            };
        } catch (e) {
            return null;
        }
    }
}

'use client';

import { db } from '@/lib/database';
import type { ZakatData } from '@/lib/types';

export class ZakatService {
    async getZakatData(): Promise<ZakatData> {
        const products = await db.products.toArray();
        const inventoryValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        
        const customers = await db.customers.toArray();
        const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

        return { inventoryValue, totalReceivables };
    }
}

'use client';

import { db } from '@/lib/database';
import type { CostingItem, Product } from '@/lib/types';

export class CostingService {
    async applyNewPurchasePrices(costingItems: CostingItem[]): Promise<void> {
        const now = new Date();
        await db.transaction('rw', db.products, async () => {
            const productIds = costingItems.map(item => item.productId).filter((id): id is number => !!id);
            if (productIds.length === 0) return;

            const products = await db.products.bulkGet(productIds);
            const productMap = new Map(products.filter((p): p is Product => !!p).map(p => [p.id!, p]));
            
            const updates: { key: number, changes: Partial<Product> }[] = [];

            for (const item of costingItems) {
                if (item.productId) {
                    const product = productMap.get(item.productId);
                    if (product && product.purchasePrice !== item.finalCostPerUnit) {
                         updates.push({
                             key: item.productId,
                             changes: {
                                 purchasePrice: item.finalCostPerUnit,
                                 dateMajPrix: now,
                                 updatedAt: now
                             }
                         });
                    }
                }
            }
            
            if (updates.length > 0) {
                 await db.products.bulkUpdate(updates);
            }
        });
    }
}

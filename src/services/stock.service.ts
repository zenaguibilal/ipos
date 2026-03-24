'use client';

import { db } from '@/lib/database';
import type { StockIntake, StockIntakeItem, Product, Supplier } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class StockService {
    async addStockIntake(intakeData: any, items: StockIntakeItem[]): Promise<StockIntake> {
        return db.transaction('rw', db.stockIntakes, db.products, db.suppliers, db.sync_queue, async () => {
            const now = new Date();
            const deviceId = syncService.getLocalDeviceId();

            let supplier = await db.suppliers.where('name').equalsIgnoreCase(intakeData.supplierName).first();
            if (!supplier) {
                const supplierUuid = uuidv4();
                const newSupplier: Omit<Supplier, 'id'> = {
                    name: intakeData.supplierName, 
                    balance: 0, 
                    uuid: supplierUuid,
                    createdAt: now, 
                    updatedAt: now,
                    sync_status: 'pending_create',
                    last_modified_by: deviceId
                };
                const supplierId = await db.suppliers.add(newSupplier as Supplier);
                await syncService.queueSyncOperation('suppliers', supplierUuid, 'create', { ...newSupplier, id: undefined });
                supplier = await db.suppliers.get(supplierId);
            }

            const processedItems = [];
            for (const item of items) {
                let product = item.productId ? await db.products.get(item.productId) : null;
                
                if (item.isNew) {
                    const productUuid = uuidv4();
                    const newProductData: Omit<Product, 'id'> = {
                        name: item.name,
                        category: item.category,
                        price: item.price,
                        purchasePrice: item.purchasePrice,
                        quantity: 0,
                        minStockLevel: 10,
                        barcodes: item.barcodes,
                        fournisseurId: supplier!.id,
                        unite: 'Pièce',
                        uuid: productUuid,
                        createdAt: now,
                        updatedAt: now,
                        sync_status: 'pending_create',
                        last_modified_by: deviceId
                    };
                    const newProductId = await db.products.add(newProductData as Product);
                    await syncService.queueSyncOperation('products', productUuid, 'create', { ...newProductData, id: undefined });
                    product = await db.products.get(newProductId);
                }

                if (product && product.uuid) {
                    const updateData = {
                        quantity: product.quantity + (item.quantity - item.quantityDamaged),
                        purchasePrice: item.purchasePrice,
                        dateMajPrix: now,
                        fournisseurId: supplier!.id,
                        updatedAt: now,
                        last_modified_by: deviceId,
                        sync_status: product.sync_status === 'pending_create' ? 'pending_create' : 'pending_update' as const,
                        ...(item.isNew && { price: item.price })
                    };

                    await db.products.update(product.id!, updateData);
                    await syncService.queueSyncOperation('products', product.uuid, 'update', updateData);

                     processedItems.push({
                        productId: product.id!,
                        productName: item.name,
                        quantityReceived: item.quantity,
                        quantityDamaged: item.quantityDamaged,
                        purchasePrice: item.purchasePrice,
                    });
                }
            }

            const totalValue = processedItems.reduce((acc, item) => acc + item.quantityReceived * item.purchasePrice, 0);

            const intakeUuid = uuidv4();
            const newIntake: StockIntake = {
                ...intakeData,
                uuid: intakeUuid,
                supplierId: supplier!.id!,
                items: processedItems,
                totalValue,
                createdAt: now,
                updatedAt: now,
                sync_status: 'pending_create',
                last_modified_by: deviceId
            };

            const id = await db.stockIntakes.add(newIntake);
            await syncService.queueSyncOperation('stockIntakes', intakeUuid, 'create', { ...newIntake, id: undefined });
            return { ...newIntake, id };
        });
    }

    async getStockIntakes(params: { query?: string, from?: Date, to?: Date } = {}): Promise<StockIntake[]> {
        let collection = db.stockIntakes.where('sync_status').notEqual('pending_delete').reverse();
        if (params.from && params.to) {
            collection = collection.filter(i => i.createdAt! >= params.from! && i.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(i => i.supplierName?.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
        }
        return await collection.sortBy('createdAt');
    }
}

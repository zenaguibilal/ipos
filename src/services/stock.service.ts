
'use client';

import { db } from '@/lib/database';
import type { StockIntake, StockIntakeItem, Product, Supplier } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';
import { inventoryService } from './inventory.service';
import { calculateStockStatus } from '@/lib/utils';

export class StockService {
    async addStockIntake(intakeData: { supplierUuid?: string; supplierName: string; invoiceNumber: string; invoiceDate: Date }, items: StockIntakeItem[]): Promise<StockIntake> {
        return db.transaction('rw', db.stockIntakes, db.products, db.suppliers, db.sync_queue, db.inventoryLogs, async () => {
            const now = new Date();
            const deviceId = syncService.getLocalDeviceId();
            let supplierUuid: string;
            let supplierName = intakeData.supplierName;

            // 1. Find or Create Supplier
            let supplier: Supplier | undefined;
            if (intakeData.supplierUuid) {
                supplier = await db.suppliers.where({ uuid: intakeData.supplierUuid }).first();
            }
            if (!supplier) {
                supplier = await db.suppliers.where('name').equalsIgnoreCase(supplierName).and(s => s.sync_status !== 'pending_delete').first();
            }

            if (!supplier) {
                const newSupplierUuid = uuidv4();
                const newSupplier: Omit<Supplier, 'id'> = {
                    name: supplierName,
                    balance: 0,
                    uuid: newSupplierUuid,
                    createdAt: now,
                    updatedAt: now,
                    sync_status: 'pending_create',
                    last_modified_by: deviceId
                };
                const supplierId = await db.suppliers.add(newSupplier as Supplier);
                await syncService.queueSyncOperation('suppliers', newSupplierUuid, 'create', { ...newSupplier, id: undefined });
                supplierUuid = newSupplierUuid;
            } else {
                supplierUuid = supplier.uuid;
            }

            // 2. Create placeholder StockIntake record
            const intakeUuid = uuidv4();
            const newIntake: Omit<StockIntake, 'id'> = {
                uuid: intakeUuid,
                supplierUuid,
                supplierName: supplierName,
                invoiceNumber: intakeData.invoiceNumber,
                invoiceDate: intakeData.invoiceDate,
                items: [], // Will be populated later
                totalValue: 0,
                createdAt: now,
                updatedAt: now,
                sync_status: 'pending_create',
                last_modified_by: deviceId
            };
            const intakeId = await db.stockIntakes.add(newIntake as StockIntake);

            // 3. Process items, creating/updating products
            const processedItems = [];
            for (const item of items) {
                let product = item.productId ? await db.products.get(item.productId) : null;
                
                if (item.isNew && !product) {
                    const newProductUuid = uuidv4();
                    const newProductData: Omit<Product, 'id'> = {
                        name: item.name,
                        category: item.category,
                        price: item.price,
                        purchasePrice: item.purchasePrice,
                        quantity: 0, // Initial quantity is 0, will be updated by inventoryService
                        minStockLevel: 10,
                        barcodes: item.barcodes,
                        supplierUuid: supplierUuid,
                        unite: 'Pièce',
                        uuid: newProductUuid,
                        createdAt: now,
                        updatedAt: now,
                        stockStatus: calculateStockStatus(0, 10),
                        sync_status: 'pending_create',
                        last_modified_by: deviceId,
                    };
                    const newProductId = await db.products.add(newProductData as Product);
                    await syncService.queueSyncOperation('products', newProductUuid, 'create', { ...newProductData, id: undefined });
                    product = { ...newProductData, id: newProductId };
                }

                if (product && product.id) {
                    const stockChange = item.quantity - item.quantityDamaged;
                    await inventoryService.adjustStock(product.id, stockChange, 'stock_intake', intakeId);

                    const productUpdatePayload: Partial<Product> = {
                        purchasePrice: item.purchasePrice,
                        dateMajPrix: now,
                        supplierUuid: supplierUuid,
                        ...(item.isNew && { price: item.price })
                    };

                     await db.products.update(product.id, productUpdatePayload);
                     await syncService.queueSyncOperation('products', product.uuid, 'update', { ...productUpdatePayload, updatedAt: now, last_modified_by: deviceId });
                     
                     processedItems.push({
                        productId: product.id,
                        productName: item.name,
                        quantityReceived: item.quantity,
                        quantityDamaged: item.quantityDamaged,
                        purchasePrice: item.purchasePrice,
                    });
                }
            }

            // 4. Finalize StockIntake record
            const totalValue = processedItems.reduce((acc, item) => acc + item.quantityReceived * item.purchasePrice, 0);
            const finalIntakePayload = { items: processedItems, totalValue };
            await db.stockIntakes.update(intakeId, finalIntakePayload);
            await syncService.queueSyncOperation('stock_intakes', intakeUuid, 'update', { ...finalIntakePayload, updatedAt: now, last_modified_by: deviceId });


            const finalRecord = await db.stockIntakes.get(intakeId);
            return finalRecord!;
        });
    }

    async getStockIntakes(params: { query?: string, from?: Date, to?: Date } = {}): Promise<StockIntake[]> {
        let collection;
        if (params.from && params.to) {
            collection = db.stockIntakes.where('createdAt').between(params.from, params.to, true, true);
        } else {
            collection = db.stockIntakes.toCollection();
        }

        collection = collection.and(i => i.sync_status !== 'pending_delete');

        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(i => i.supplierName?.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
        }
        return await collection.orderBy('createdAt').reverse().toArray();
    }
}

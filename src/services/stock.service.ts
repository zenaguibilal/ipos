'use client';

import { db } from '@/lib/database';
import type { StockIntake, StockIntakeItem, Product, Supplier } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './sync.service';

export class StockService {
    async addStockIntake(intakeData: { supplierUuid: string; supplierName: string; invoiceNumber: string; invoiceDate: Date }, items: StockIntakeItem[]): Promise<StockIntake> {
        return db.transaction('rw', db.stockIntakes, db.products, db.suppliers, db.sync_queue, async () => {
            const now = new Date();
            const deviceId = syncService.getLocalDeviceId();
            let supplierUuid = intakeData.supplierUuid;

            if (!supplierUuid && intakeData.supplierName) {
                let supplier = await db.suppliers.where('name').equalsIgnoreCase(intakeData.supplierName).and(s => s.sync_status !== 'pending_delete').first();
                if (!supplier) {
                    const newSupplierUuid = uuidv4();
                    const newSupplier: Omit<Supplier, 'id'> = {
                        name: intakeData.supplierName, 
                        balance: 0, 
                        uuid: newSupplierUuid,
                        createdAt: now, 
                        updatedAt: now,
                        sync_status: 'pending_create',
                        last_modified_by: deviceId
                    };
                    const supplierId = await db.suppliers.add(newSupplier as Supplier);
                    await syncService.queueSyncOperation('suppliers', newSupplierUuid, 'create', { ...newSupplier, id: undefined });
                    supplier = await db.suppliers.get(supplierId);
                }
                supplierUuid = supplier!.uuid;
            }

            if (!supplierUuid) {
                throw new Error("Supplier information is missing.");
            }

            const processedItems = [];
            for (const item of items) {
                let product = item.productId ? await db.products.get(item.productId) : null;
                
                if (item.isNew) {
                    const productUuid = uuidv4();
                    const newProductData: Omit<Product, 'id' | 'uuid'> = {
                        name: item.name,
                        category: item.category,
                        price: item.price,
                        purchasePrice: item.purchasePrice,
                        quantity: 0,
                        minStockLevel: 10,
                        barcodes: item.barcodes,
                        supplierUuid: supplierUuid,
                        unite: 'Pièce',
                    };
                    product = await productService.addProduct(newProductData);
                }

                if (product && product.uuid) {
                    const updateData: Partial<Product> = {
                        quantity: product.quantity + (item.quantity - item.quantityDamaged),
                        purchasePrice: item.purchasePrice,
                        dateMajPrix: now,
                        supplierUuid: supplierUuid,
                        ...(item.isNew && { price: item.price })
                    };

                    await productService.updateProduct(product.id!, updateData);

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
            const newIntake: Omit<StockIntake, 'id'> = {
                uuid: intakeUuid,
                supplierUuid,
                supplierName: intakeData.supplierName,
                invoiceNumber: intakeData.invoiceNumber,
                invoiceDate: intakeData.invoiceDate,
                items: processedItems,
                totalValue,
                createdAt: now,
                updatedAt: now,
                sync_status: 'pending_create',
                last_modified_by: deviceId
            };

            const id = await db.stockIntakes.add(newIntake as StockIntake);
            await syncService.queueSyncOperation('stockIntakes', intakeUuid, 'create', { ...newIntake, id: undefined });
            return { ...newIntake, id };
        });
    }

    async getStockIntakes(params: { query?: string, from?: Date, to?: Date } = {}): Promise<StockIntake[]> {
        let collection = db.stockIntakes.where('sync_status').notEqual('pending_delete');
        if (params.from && params.to) {
            collection = db.stockIntakes.where('createdAt').between(params.from, params.to, true, true)
                .and(i => i.sync_status !== 'pending_delete');
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(i => i.supplierName?.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
        }
        return await collection.reverse().sortBy('createdAt');
    }
}

// Need to import productService to avoid circular dependency issues at runtime
import { productService } from './product.service';

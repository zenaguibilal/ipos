'use client';

import { db } from '@/lib/database';
import type { StockIntake, StockIntakeItem, Product } from '@/lib/types';

export class StockService {
    async addStockIntake(intakeData: any, items: StockIntakeItem[]): Promise<StockIntake> {
        return db.transaction('rw', db.stockIntakes, db.products, db.suppliers, async () => {
            const now = new Date();

            let supplier = await db.suppliers.where('name').equalsIgnoreCase(intakeData.supplierName).first();
            if (!supplier) {
                const supplierId = await db.suppliers.add({ name: intakeData.supplierName, balance: 0, createdAt: now, updatedAt: now });
                supplier = await db.suppliers.get(supplierId);
            }

            const processedItems = [];
            for (const item of items) {
                let productId: number | undefined = item.productId;
                if (item.isNew) {
                    const newProduct: Omit<Product, 'id'> = {
                        name: item.name,
                        category: item.category,
                        price: item.price,
                        purchasePrice: item.purchasePrice,
                        quantity: 0,
                        minStockLevel: 10,
                        barcodes: item.barcodes,
                        fournisseurId: supplier!.id,
                        unite: 'Pièce',
                    };
                    productId = await db.products.add(newProduct as Product) as number;
                }

                await db.products.where('id').equals(productId!).modify(p => {
                    p.quantity += (item.quantity - item.quantityDamaged);
                    p.purchasePrice = item.purchasePrice;
                    if (item.isNew) p.price = item.price;
                    p.dateMajPrix = now;
                    if (supplier?.id) p.fournisseurId = supplier.id;
                });
                
                processedItems.push({
                    productId: productId,
                    productName: item.name,
                    quantityReceived: item.quantity,
                    quantityDamaged: item.quantityDamaged,
                    purchasePrice: item.purchasePrice,
                });
            }

            const totalValue = processedItems.reduce((acc, item) => acc + item.quantityReceived * item.purchasePrice, 0);

            const newIntake: StockIntake = {
                ...intakeData,
                supplierId: supplier!.id!,
                items: processedItems,
                totalValue,
                createdAt: now,
                updatedAt: now,
            };

            const id = await db.stockIntakes.add(newIntake);
            return { ...newIntake, id };
        });
    }

    async getStockIntakes(params: { query?: string, from?: Date, to?: Date }): Promise<StockIntake[]> {
        let collection = db.stockIntakes.orderBy('createdAt').reverse();
        if (params.from && params.to) {
            collection = collection.filter(i => i.createdAt! >= params.from! && i.createdAt! <= params.to!);
        }
        if (params.query) {
            const q = params.query.toLowerCase();
            collection = collection.filter(i => i.supplierName?.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q));
        }
        return await collection.toArray();
    }
}

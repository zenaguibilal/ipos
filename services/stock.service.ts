'use client';
import { v4 as uuidv4 } from 'uuid';
import type { StockIntake, StockIntakeItem, Product } from '@/lib/types';
import { stockRepository, supplierRepository } from '@/repositories';
import { inventoryService } from './inventory.service';
import { productService } from './product.service';
import { toast } from 'sonner';

class StockService {
    
    async getStockIntakes(filters: { query?: string; from?: Date; to?: Date }): Promise<StockIntake[]> {
        return stockRepository.filter(filters);
    }
    
    async addStockIntake(
        intakeData: { supplierUuid?: string, supplierName: string, invoiceNumber: string, invoiceDate: Date },
        items: StockIntakeItem[]
    ): Promise<StockIntake> {

        let supplierUuid = intakeData.supplierUuid;
        let supplierName = intakeData.supplierName;

        // 1. Find or create supplier
        if (supplierUuid) {
            const existingSupplier = await supplierRepository.findByUuid(supplierUuid);
            if (!existingSupplier) {
                toast.warning(`Le fournisseur avec l'ID ${supplierUuid} n'a pas été trouvé. Un nouveau fournisseur sera créé.`);
                supplierUuid = ''; // Force creation if UUID is invalid
            } else {
                supplierName = existingSupplier.name;
            }
        } 
        
        if (!supplierUuid && supplierName) {
             const existingByName = await supplierRepository.findByName(supplierName);
             if (existingByName) {
                 supplierUuid = existingByName.uuid;
             } else {
                const newSupplier = await supplierRepository.add({
                    uuid: uuidv4(),
                    user_id: 'user_id_placeholder',
                    name: supplierName,
                    balance: 0,
                });
                supplierUuid = newSupplier.uuid;
             }
        }

        if (!supplierUuid) {
            throw new Error("Impossible de déterminer le fournisseur.");
        }

        // 2. Create the stock intake record
        const now = new Date();
        const newIntake: StockIntake = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder',
            supplierUuid,
            supplierName: supplierName,
            invoiceNumber: intakeData.invoiceNumber,
            invoiceDate: intakeData.invoiceDate,
            items: items.map(item => ({
                productUuid: item.productUuid,
                productName: item.name,
                quantityReceived: item.quantity,
                quantityDamaged: item.quantityDamaged,
                purchasePrice: item.purchasePrice,
            })),
            totalValue: items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0),
            createdAt: now,
            updatedAt: now,
        };

        const createdIntake = await stockRepository.add(newIntake);

        // 3. Process each item: create new product OR update existing stock
        for (const item of items) {
            const effectiveQuantity = item.quantity - item.quantityDamaged;
            if (effectiveQuantity <= 0 && !item.isNew) continue;
            
            if (item.isNew) {
                const newProductData: Omit<Product, 'uuid' | 'user_id'> = {
                    name: item.name,
                    category: item.category || 'Non classé',
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    quantity: 0, // Will be set by adjustStock
                    minStockLevel: 10,
                    barcodes: item.barcodes,
                    supplierUuid,
                    dateMajPrix: now,
                };
                const newProduct = await productService.addProduct(newProductData);
                await inventoryService.adjustStock(newProduct.uuid, effectiveQuantity, 'stock_intake', createdIntake.uuid);

            } else if (item.productUuid) {
                // Update prices first
                await productService.updateProduct(item.productUuid, {
                    purchasePrice: item.purchasePrice,
                    price: item.price,
                    dateMajPrix: now,
                });
                // Then adjust stock
                await inventoryService.adjustStock(item.productUuid, effectiveQuantity, 'stock_intake', createdIntake.uuid);
            }
        }

        return createdIntake;
    }
}

export const stockService = new StockService();

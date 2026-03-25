'use client';
import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem } from '@/lib/types';
import { returnRepository, saleRepository } from '@/repositories';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';

class ReturnService {

    async getReturnByUuid(uuid: string): Promise<ProductReturn | undefined> {
        return returnRepository.findByUuid(uuid);
    }

    async filterReturns(filters: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
        return returnRepository.filter(filters);
    }
    
    async addReturn(returnData: {
        originalSaleUuid: string,
        items: ReturnItem[],
        totalReturnValue: number,
        amountRefunded: number,
        customerUuid?: string,
        notes?: string
    }): Promise<ProductReturn> {
        
        const sale = await saleRepository.findByUuid(returnData.originalSaleUuid);
        if (!sale) {
            throw new Error("La vente originale est introuvable.");
        }

        const now = new Date();
        const newReturn: ProductReturn = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            originalSaleUuid: returnData.originalSaleUuid,
            originalInvoiceNumber: sale.invoiceNumber,
            items: returnData.items,
            totalReturnValue: returnData.totalReturnValue,
            amountRefunded: returnData.amountRefunded,
            customerUuid: returnData.customerUuid,
            createdAt: now,
            updatedAt: now,
            notes: returnData.notes,
        };

        const createdReturn = await returnRepository.add(newReturn);

        // Adjust stock for restocked items
        for (const item of returnData.items) {
            if (item.wasRestocked && item.productUuid) {
                await inventoryService.adjustStock(item.productUuid, item.quantity, 'return', newReturn.uuid);
            }
        }
        
        if (createdReturn.customerUuid) {
            await customerService.recalculateCustomerStatus(createdReturn.customerUuid);
        }

        return createdReturn;
    }

    async deleteReturn(uuid: string): Promise<ProductReturn> {
        const productReturn = await returnRepository.findByUuid(uuid);
        if (!productReturn) {
            throw new Error("Retour non trouvé.");
        }

        // Reverse stock adjustment
        for (const item of productReturn.items) {
            if (item.wasRestocked && item.productUuid) {
                await inventoryService.adjustStock(item.productUuid, -item.quantity, 'cancellation', productReturn.uuid);
            }
        }

        await returnRepository.delete(uuid);
        
        if (productReturn.customerUuid) {
            await customerService.recalculateCustomerStatus(productReturn.customerUuid);
        }

        return productReturn;
    }
}

export const returnService = new ReturnService();


'use client';
import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem } from '@/lib/types';
import { returnRepository } from '@/repositories/return.repository';
import { saleRepository } from '@/repositories/sale.repository';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';

class ReturnService {

     private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

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
            user_id: this.getUserId(),
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

        return await returnRepository.add(newReturn);
    }

    async processReturnCancellation(uuid: string): Promise<void> {
        const productReturn = await returnRepository.findByUuid(uuid);
        if (!productReturn) {
            throw new Error("Retour non trouvé.");
        }

        // 1. Delete the return record
        await returnRepository.delete(uuid);
        
        // 2. Reverse stock adjustment for restocked items
        for (const item of productReturn.items) {
            if (item.wasRestocked && item.productUuid) {
                // We add a negative quantity because the original return added a positive quantity
                await inventoryService.adjustStock(item.productUuid, -item.quantity, 'cancellation', productReturn.uuid);
            }
        }
        
        // 3. Recalculate customer status
        if (productReturn.customerUuid) {
            await customerService.recalculateCustomerStatus(productReturn.customerUuid);
        }
    }
}

export const returnService = new ReturnService();

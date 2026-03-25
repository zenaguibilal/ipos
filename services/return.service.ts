'use client';
import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem } from '@/lib/types';
import { returnRepository } from '@/repositories/return.repository';
import { saleRepository } from '@/repositories/sale.repository';

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

        // The service's responsibility ends at creating the return record.
        // Orchestration of inventory and customer updates is handled by the calling layer.
        return await returnRepository.add(newReturn);
    }

    async deleteReturn(uuid: string): Promise<ProductReturn> {
        const productReturn = await returnRepository.findByUuid(uuid);
        if (!productReturn) {
            throw new Error("Retour non trouvé.");
        }

        await returnRepository.delete(uuid);
        
        // Return the deleted object so the orchestrator knows what to revert.
        return productReturn;
    }
}

export const returnService = new ReturnService();

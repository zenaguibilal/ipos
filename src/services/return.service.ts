
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem, Customer } from '@/lib/types';
import { returnRepository } from '@/repositories/return.repository';
import { saleRepository } from '@/repositories/sale.repository';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';

class ReturnService {

     private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getReturnByUuid(uuid: string): Promise<ProductReturn | undefined> {
        try {
            return await returnRepository.findByUuid(uuid);
        } catch (error) {
            throw error;
        }
    }

    async filterReturns(filters: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
        try {
            return await returnRepository.filter(filters);
        } catch (error) {
            throw error;
        }
    }
    
    async addReturn(returnData: {
        originalSaleUuid: string,
        items: ReturnItem[],
        totalReturnValue: number,
        amountRefunded: number,
        customerUuid?: string,
        notes?: string
    }): Promise<ProductReturn> {
        try {
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
        } catch (error) {
            throw error;
        }
    }

    async processReturnCancellation(uuid: string): Promise<void> {
        try {
            const productReturn = await returnRepository.findByUuid(uuid);
            if (!productReturn) {
                throw new Error("Retour non trouvé.");
            }

            await returnRepository.delete(uuid);
            
            for (const item of productReturn.items) {
                if (item.wasRestocked && item.productUuid) {
                    await inventoryService.adjustStock(item.productUuid, -item.quantity, 'cancellation', productReturn.uuid);
                }
            }
            
            if (productReturn.customerUuid) {
                await customerService.recalculateCustomerStatus(productReturn.customerUuid);
            }
        } catch (error) {
            throw error;
        }
    }

    async exportToCSV(returns: ProductReturn[], customerMap: Map<string, Customer>) {
        const rows = returns.flatMap(pr => {
            const customer = pr.customerUuid ? customerMap.get(pr.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
            
            return pr.items.map(item => ({
                'Date Retour': pr.createdAt ? new Date(pr.createdAt).toLocaleString('fr-FR') : '',
                'Facture Originale': pr.originalInvoiceNumber,
                'Client': customerName,
                'Article': item.productName,
                'Qté Retournée': item.quantity,
                'Prix Vente': item.price,
                'Valeur Retour': item.price * item.quantity,
                'Montant Remboursé': pr.amountRefunded,
                'Réintégré Stock': item.wasRestocked ? 'Oui' : 'Non',
                'Notes': pr.notes || ''
            }));
        });

        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `historique-retours-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const returnService = new ReturnService();

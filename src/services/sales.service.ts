'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { saleRepository } from '@/repositories';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';

class SalesService {

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return saleRepository.findByUuid(uuid);
    }
    
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return saleRepository.findByInvoiceNumber(invoiceNumber);
    }

    async filterSales(filters: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        return saleRepository.filter(filters);
    }

    async createSale(saleData: {
        items: CartItem[],
        discountType: 'fixed' | 'percentage',
        discountValue: number,
        amountPaid: number,
        payments: { method: 'cash' | 'card' | 'other', amount: number }[],
        customerUuid?: string | null,
        dueDate?: Date,
    }): Promise<Sale> {
        
        const now = new Date();
        const subtotal = saleData.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
        const discountAmount = saleData.discountType === 'percentage'
            ? (subtotal * saleData.discountValue) / 100
            : saleData.discountValue;
        const total = Math.max(0, subtotal - discountAmount);

        const remainingBalance = total - saleData.amountPaid;
        const paymentStatus = remainingBalance <= 0.01 ? 'paid' : (saleData.amountPaid > 0 ? 'partial' : 'unpaid');
        
        const saleItems: SaleItem[] = saleData.items.map(item => ({
            productUuid: item.uuid,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice,
            quantity: item.cartQuantity
        }));
        
        const datePrefix = now.toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const invoiceNumber = `${datePrefix}-${randomSuffix}`;

        const newSale: Sale = {
            uuid: uuidv4(),
            user_id: 'user_id_placeholder', // This will be set by the repository layer
            invoiceNumber,
            items: saleItems,
            subtotal,
            discountType: saleData.discountType,
            discountAmount: discountAmount,
            total,
            amountPaid: saleData.amountPaid,
            remainingBalance,
            paymentStatus,
            payments: saleData.payments,
            customerUuid: saleData.customerUuid || undefined,
            createdAt: now,
            updatedAt: now,
            dueDate: saleData.dueDate,
        };

        const createdSale = await saleRepository.add(newSale);

        for (const item of saleData.items) {
            // Only adjust stock for real products, not custom items
            if (item.user_id !== 'custom') { 
               await inventoryService.adjustStock(item.uuid, -item.cartQuantity, 'sale', newSale.uuid);
            }
        }
        
        if (createdSale.customerUuid) {
            await customerService.recalculateCustomerStatus(createdSale.customerUuid);
        }

        return createdSale;
    }

    async deleteSale(uuid: string): Promise<Sale> {
        const sale = await saleRepository.findByUuid(uuid);
        if (!sale) {
            throw new Error("Vente non trouvée.");
        }

        // Restore stock
        for (const item of sale.items) {
            const product = await inventoryService.getProductInfo(item.productUuid);
            if (product) {
                await inventoryService.adjustStock(item.productUuid, item.quantity, 'cancellation', sale.uuid);
            }
        }

        await saleRepository.delete(uuid);
        
        if (sale.customerUuid) {
            await customerService.recalculateCustomerStatus(sale.customerUuid);
        }

        return sale;
    }
}

export const salesService = new SalesService();

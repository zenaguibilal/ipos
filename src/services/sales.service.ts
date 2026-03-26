
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { saleRepository } from '@/repositories/sale.repository';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';

class SalesService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getAllSales(): Promise<Sale[]> {
        try {
            return await saleRepository.getAll();
        } catch (error: any) {
            throw new Error(error.message || "Une erreur est survenue lors de la récupération des ventes.");
        }
    }

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        try {
            return await saleRepository.findByUuid(uuid);
        } catch (error) {
            throw error;
        }
    }
    
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        try {
            return await saleRepository.findByInvoiceNumber(invoiceNumber);
        } catch (error) {
            throw error;
        }
    }

    async findSalesByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        try {
            return await saleRepository.findByCustomerUuid(customerUuid);
        } catch (error) {
            throw error;
        }
    }

    async filterSales(filters: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        try {
            return await saleRepository.filter(filters);
        } catch (error) {
            throw error;
        }
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
        try {
            const now = new Date();
            const subtotal = saleData.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
            const discountAmount = saleData.discountType === 'percentage'
                ? (subtotal * saleData.discountValue) / 100
                : saleData.discountValue;
            const total = Math.max(0, subtotal - discountAmount);

            const remainingBalance = total - saleData.amountPaid;
            const paymentStatus = remainingBalance <= 0.01 ? 'paid' : (saleData.amountPaid > 0 ? 'partial' : 'unpaid');
            
            const saleItems: SaleItem[] = saleData.items.map(item => ({
                productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
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
                user_id: this.getUserId(),
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

            return await saleRepository.add(newSale);
        } catch (error) {
            throw error;
        }
    }

    async processSaleCancellation(uuid: string): Promise<void> {
        try {
            const sale = await saleRepository.findByUuid(uuid);
            if (!sale) {
                throw new Error("Vente non trouvée.");
            }

            await saleRepository.delete(uuid);
            
            for (const item of sale.items) {
                 await inventoryService.adjustStock(item.productUuid, item.quantity, 'cancellation', sale.uuid);
            }

            if (sale.customerUuid) {
                await customerService.recalculateCustomerStatus(sale.customerUuid);
            }
        } catch (error) {
            throw error;
        }
    }
}

export const salesService = new SalesService();

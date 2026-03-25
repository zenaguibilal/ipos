'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { saleRepository } from '@/repositories/sale.repository';
import { useAppStore } from '@/stores/appStore';

class SalesService {

    private getUserId(): string {
        const session = useAppStore.getState().session;
        if (!session?.user?.id) {
            throw new Error("User not authenticated");
        }
        return session.user.id;
    }

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return saleRepository.findByUuid(uuid);
    }
    
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return saleRepository.findByInvoiceNumber(invoiceNumber);
    }

    async findSalesByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        return saleRepository.findByCustomerUuid(customerUuid);
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

        // The service's responsibility ends here. It creates the sale record.
        // Orchestration of inventory and customer updates is handled by the calling layer (e.g., appStore).
        return await saleRepository.add(newSale);
    }

    async deleteSale(uuid: string): Promise<Sale> {
        const sale = await saleRepository.findByUuid(uuid);
        if (!sale) {
            throw new Error("Vente non trouvée.");
        }

        await saleRepository.delete(uuid);
        
        // Return the deleted sale so the orchestrator knows what to revert.
        return sale;
    }
}

export const salesService = new SalesService();

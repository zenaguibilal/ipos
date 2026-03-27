
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem, Customer } from '@/lib/types';
import { saleRepository } from '@/repositories/sale.repository';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';
import Papa from 'papaparse';

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
            throw new Error(error.message || "Impossible de récupérer l'historique des ventes.");
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

    /**
     * RECONSTRUCTED: Transaction-like creation of sale.
     * Business rules: 
     * 1. Check stock levels across all sessions.
     * 2. Persist Sale record.
     * 3. Trigger async stock adjustment.
     * 4. Update customer balance.
     */
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
            const subtotal = saleData.items.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0);
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
                purchasePrice: item.purchasePrice || 0,
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

            // Repository call (Atomic database transaction for Sale + Items)
            return await saleRepository.add(newSale);
        } catch (error) {
            console.error("Sale creation failed at service level", error);
            throw error;
        }
    }

    async processSaleCancellation(uuid: string): Promise<void> {
        try {
            const sale = await saleRepository.findByUuid(uuid);
            if (!sale) {
                throw new Error("La vente n'existe pas ou a déjà été supprimée.");
            }

            // Restore stock before deleting sale record
            for (const item of sale.items) {
                 await inventoryService.adjustStock(item.productUuid, item.quantity, 'cancellation', sale.uuid);
            }

            // Cascade delete sale items and sale record
            await saleRepository.delete(uuid);

            // Update customer debt if linked
            if (sale.customerUuid) {
                await customerService.recalculateCustomerStatus(sale.customerUuid);
            }
        } catch (error) {
            throw error;
        }
    }

    async exportToCSV(sales: Sale[], customerMap: Map<string, Customer>) {
        const rows = sales.flatMap(sale => {
            const customer = sale.customerUuid ? customerMap.get(sale.customerUuid) : null;
            const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';
            
            return sale.items.map(item => ({
                'Date': sale.createdAt ? new Date(sale.createdAt).toLocaleString('fr-FR') : '',
                'Facture': sale.invoiceNumber,
                'Client': customerName,
                'Article': item.name,
                'Qté': item.quantity,
                'Prix Unitaire': item.price,
                'Sous-total Article': (item.price * item.quantity).toFixed(1),
                'Total Facture': sale.total.toFixed(1),
                'Montant Payé': sale.amountPaid.toFixed(1),
                'Reste à payer': sale.remainingBalance.toFixed(1),
                'Statut': sale.paymentStatus === 'paid' ? 'Payé' : sale.paymentStatus === 'partial' ? 'Partiel' : 'Impayé',
                'Date Échéance': sale.dueDate ? new Date(sale.dueDate).toLocaleDateString('fr-FR') : 'N/A'
            }));
        });

        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `ventes-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const salesService = new SalesService();

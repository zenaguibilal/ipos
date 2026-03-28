import { createClient } from "@/utils/supabase/server";
import type { Sale } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from "./product.repository";
import { CustomerRepository } from "./customer.repository";

/**
 * @fileOverview Référentiel de Vente (Autorité Serveur Autonome)
 * Phase 16 : Enregistrement déterministe et mise à jour des stocks.
 */
export class SaleRepository {
    private supabase = createClient();
    private productRepo = new ProductRepository();
    private customerRepo = new CustomerRepository();

    /**
     * Génère un numéro de facture avec une entropie élevée via crypto.
     */
    private generateInvoiceNumber(): string {
        const now = new Date();
        const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
        
        const array = new Uint32Array(1);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array);
        } else {
            array[0] = Math.floor(Math.random() * 0xFFFFFFFF);
        }
        
        const randomPart = array[0].toString(16).toUpperCase().slice(-6).padStart(6, '0');
        
        return `INV-${datePart}-${randomPart}`;
    }

    async findByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('customer_uuid', customerUuid)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data.map(this.mapFromDb);
    }

    async getAll(): Promise<Sale[]> {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('created_at', { ascending: false });
        if (error) throw new Error(`ACCES_GRAND_LIVRE_REFUSE`);
        return data.map(this.mapFromDb);
    }

    async create(saleData: any): Promise<Sale> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("NON_AUTORISE");

        const invoiceNumber = this.generateInvoiceNumber();
        const saleUuid = uuidv4();
        
        const { data: sale, error: sErr } = await this.supabase
            .from('sales')
            .insert([{
                uuid: saleUuid,
                user_id: user.id,
                invoice_number: invoiceNumber,
                subtotal: saleData.subtotal,
                discount_type: saleData.discountType,
                discount_amount: saleData.discountAmount,
                total: saleData.total,
                amount_paid: saleData.amountPaid,
                remaining_balance: saleData.remainingBalance,
                payment_status: saleData.paymentStatus,
                payments: saleData.payments,
                customer_uuid: saleData.customerUuid,
                due_date: saleData.dueDate,
            }])
            .select()
            .single();

        if (sErr) throw new Error(`ECHEC_PERSISTENCE_VENTE`);

        const saleItems = saleData.items.map((item: any) => ({
            user_id: user.id,
            sale_uuid: saleUuid,
            product_uuid: item.productUuid || null,
            name: item.name,
            price: item.price,
            purchase_price: item.purchasePrice || 0,
            quantity: item.cartQuantity || item.quantity,
        }));

        await this.supabase.from('sale_items').insert(saleItems);

        for (const item of saleItems) {
            if (item.product_uuid) {
                await this.productRepo.updateStock(item.product_uuid, -item.quantity, 'sale', saleUuid);
            }
        }

        if (saleData.customerUuid) {
            await this.customerRepo.recalculateBalance(saleData.customerUuid);
        }

        return this.mapFromDb({ ...sale, sale_items: saleItems });
    }

    async delete(uuid: string): Promise<void> {
        const { data: sale, error: fErr } = await this.supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('uuid', uuid)
            .single();
        
        if (fErr || !sale) throw new Error("VENTE_INTROUVABLE");

        for (const item of sale.sale_items) {
            if (item.product_uuid) {
                await this.productRepo.updateStock(item.product_uuid, item.quantity, 'cancellation', uuid);
            }
        }

        const { error: dErr } = await this.supabase.from('sales').delete().eq('uuid', uuid);
        if (dErr) throw new Error(`ECHEC_ANNULATION_VENTE`);

        if (sale.customer_uuid) {
            await this.customerRepo.recalculateBalance(sale.customer_uuid);
        }
    }

    private mapFromDb(s: any): Sale {
        return {
            uuid: s.uuid,
            user_id: s.user_id,
            invoiceNumber: s.invoice_number,
            subtotal: s.subtotal,
            discountType: s.discount_type,
            discountAmount: s.discount_amount,
            total: s.total,
            amountPaid: s.amount_paid,
            remainingBalance: s.remaining_balance,
            paymentStatus: s.payment_status,
            payments: s.payments || [],
            customerUuid: s.customer_uuid,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            dueDate: s.due_date,
            items: s.sale_items?.map((item: any) => ({
                productUuid: item.product_uuid,
                name: item.name,
                price: item.price,
                purchasePrice: item.purchase_price,
                quantity: item.quantity
            })) || [],
        };
    }
}

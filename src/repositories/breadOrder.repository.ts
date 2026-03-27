import { createClient } from "@/utils/supabase/server";
import type { BreadOrder } from "@/lib/types";
import { SaleRepository } from "./sale.repository";
import { CustomerRepository } from "./customer.repository";
import { format } from 'date-fns';

/**
 * @fileOverview BreadOrder Repository (Absolute Data Authority)
 * المركز السيادي لإدارة طلبيات الخبز وعمليات التحويل والإنتاج.
 */
export class BreadOrderRepository {
    private supabase = createClient();
    private saleRepo = new SaleRepository();
    private customerRepo = new CustomerRepository();

    async getForDate(date: string): Promise<BreadOrder[]> {
        const { data, error } = await this.supabase
            .from('bread_orders')
            .select('*')
            .eq('date', date)
            .order('created_at', { ascending: true });
        if (error) throw new Error(`BREAD_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async create(order: Partial<BreadOrder>): Promise<BreadOrder> {
        const { data, error } = await this.supabase
            .from('bread_orders')
            .insert([{
                order_name: order.orderName,
                customer_uuid: order.customerUuid,
                date: order.date,
                quantite: order.quantite || 0,
                quantite_origine: order.quantite,
                est_paye: false,
                est_livre: false,
            }])
            .select()
            .single();
        if (error) throw new Error(`BREAD_CREATE_FAILED: ${error.message}`);
        return this.mapFromDb(data);
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const { error } = await this.supabase.from('bread_orders').delete().in('uuid', uuids);
        if (error) throw new Error(`BREAD_BULK_DELETE_FAILURE: ${error.message}`);
    }

    async update(uuid: string, data: Partial<BreadOrder>): Promise<void> {
        const { error } = await this.supabase
            .from('bread_orders')
            .update({
                quantite: data.quantite,
                est_paye: data.est_paye,
                est_livre: data.est_livre,
                vente_uuid: data.venteUuid,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid);
        if (error) throw new Error(`BREAD_UPDATE_FAILED: ${error.message}`);
    }

    async generateForDate(date: string): Promise<number> {
        const { data: customers } = await this.supabase
            .from('customers')
            .select('*')
            .eq('is_bread_client', true);

        if (!customers) return 0;

        const existingOrders = await this.getForDate(date);
        const existingCustomerUuids = new Set(existingOrders.map(o => o.customerUuid));

        let generatedCount = 0;
        const targetDay = format(new Date(date.replace(/-/g, '/')), 'eeee').toLowerCase();

        for (const customer of customers) {
            if (existingCustomerUuids.has(customer.uuid)) continue;

            let quantity = 0;
            if (customer.bread_type_recurrence === 'quotidien') {
                quantity = customer.bread_quantite_defaut || 0;
            } else if (customer.bread_type_recurrence === 'jours_specifiques') {
                const dayConfig = customer.bread_jours_semaine?.[targetDay];
                if (dayConfig?.actif) {
                    quantity = dayConfig.quantite || 0;
                }
            }

            if (quantity > 0) {
                await this.create({
                    orderName: `${customer.first_name} ${customer.last_name}`,
                    customerUuid: customer.uuid,
                    date,
                    quantite: quantity
                });
                generatedCount++;
            }
        }
        return generatedCount;
    }

    async convertOrdersToSales(orderUuids: string[], breadPrice: number): Promise<void> {
        const { data: orders } = await this.supabase
            .from('bread_orders')
            .select('*')
            .in('uuid', orderUuids);

        if (!orders) return;

        for (const order of orders) {
            if (order.vente_uuid) continue;

            const total = order.quantite * breadPrice;
            
            const sale = await this.saleRepo.create({
                subtotal: total,
                discountType: 'fixed',
                discountAmount: 0,
                total: total,
                amountPaid: 0,
                remainingBalance: total,
                paymentStatus: 'unpaid',
                customerUuid: order.customer_uuid,
                items: [{
                    name: "Pain",
                    price: breadPrice,
                    purchasePrice: 0,
                    quantity: order.quantite
                }]
            });

            await this.update(order.uuid, {
                venteUuid: sale.uuid,
                est_paye: false,
                est_livre: true
            });

            if (order.customer_uuid) {
                await this.customerRepo.recalculateBalance(order.customer_uuid);
            }
        }
    }

    private mapFromDb(o: any): BreadOrder {
        return {
            uuid: o.uuid,
            user_id: o.user_id,
            customerUuid: o.customer_uuid,
            orderName: o.order_name,
            date: o.date,
            quantite: o.quantite,
            quantite_origine: o.quantite_origine,
            est_paye: o.est_paye,
            est_livre: o.est_livre,
            venteUuid: o.vente_uuid,
            createdAt: o.created_at,
            updatedAt: o.updated_at,
        };
    }
}
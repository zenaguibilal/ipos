
import { NextResponse } from 'next/server';
import { SaleRepository } from '@/repositories/sale.repository';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { CustomerRepository } from '@/repositories/customer.repository';
import { createClient } from '@/utils/supabase/server';

/**
 * @fileOverview API WALL: Conversion of Bread Orders to Invoices
 */

export async function POST(req: Request) {
    try {
        const { orderUuids, breadPrice } = await req.json();
        const supabase = createClient();
        const saleRepo = new SaleRepository();
        const breadRepo = new BreadOrderRepository();
        const customerRepo = new CustomerRepository();

        const { data: orders } = await supabase
            .from('bread_orders')
            .select('*')
            .in('uuid', orderUuids);

        if (!orders) throw new Error("ORDERS_NOT_FOUND");

        for (const order of orders) {
            if (order.vente_uuid) continue;

            const total = order.quantite * breadPrice;
            
            // Create Sale
            const sale = await saleRepo.create({
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

            // Link order to sale
            await breadRepo.update(order.uuid, {
                venteUuid: sale.uuid,
                est_paye: false,
                est_livre: true
            });

            // Recalculate customer balance if applicable
            if (order.customer_uuid) {
                await customerRepo.recalculateBalance(order.customer_uuid);
            }
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

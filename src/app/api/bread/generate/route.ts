
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { BreadOrderRepository } from '@/repositories/breadOrder.repository';
import { format } from 'date-fns';

/**
 * @fileOverview API WALL: Deterministic Bread Order Generation
 */

export async function POST(req: Request) {
    try {
        const { date } = await req.json();
        const supabase = createClient();
        const breadRepo = new BreadOrderRepository();

        // 1. Fetch scheduled customers
        const { data: customers } = await supabase
            .from('customers')
            .select('*')
            .eq('is_bread_client', true);

        if (!customers) return NextResponse.json({ data: { count: 0 } });

        // 2. Fetch existing orders for today to avoid duplicates
        const existingOrders = await breadRepo.getForDate(date);
        const existingCustomerUuids = new Set(existingOrders.map(o => o.customerUuid));

        let generatedCount = 0;
        const targetDay = format(new Date(date.replace(/-/g, '/')), 'eeee').toLowerCase(); // e.g. 'monday'

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
                await breadRepo.create({
                    orderName: `${customer.first_name} ${customer.last_name}`,
                    customerUuid: customer.uuid,
                    date,
                    quantite: quantity
                });
                generatedCount++;
            }
        }

        return NextResponse.json({ data: { count: generatedCount } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

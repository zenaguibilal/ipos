import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ProductRepository } from '@/repositories/product.repository';
import { CustomerRepository } from '@/repositories/customer.repository';

/**
 * @fileOverview API WALL: Sale Resource (Cancellation)
 */

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const supabase = createClient();
        const productRepo = new ProductRepository();
        const customerRepo = new CustomerRepository();

        // 1. Fetch sale data before deletion
        const { data: sale, error: sErr } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('uuid', params.uuid)
            .single();
        
        if (sErr || !sale) throw new Error("SALE_NOT_FOUND");

        // 2. Restore stock for each item
        for (const item of sale.sale_items) {
            if (item.product_uuid) {
                await productRepo.updateStock(item.product_uuid, item.quantity);
            }
        }

        // 3. Delete sale (cascades to items)
        const { error: dErr } = await supabase.from('sales').delete().eq('uuid', params.uuid);
        if (dErr) throw dErr;

        // 4. Recalculate customer balance
        if (sale.customer_uuid) {
            await customerRepo.recalculateBalance(sale.customer_uuid);
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * @fileOverview API WALL: Customer Unified Activity Stream
 */

export async function GET(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const supabase = createClient();
        
        const [salesRes, paymentsRes, returnsRes] = await Promise.all([
            supabase.from('sales').select('*').eq('customer_uuid', params.uuid).order('created_at', { ascending: false }),
            supabase.from('payments').select('*').eq('customer_uuid', params.uuid).order('created_at', { ascending: false }),
            supabase.from('product_returns').select('*').eq('customer_uuid', params.uuid).order('created_at', { ascending: false })
        ]);

        const activities = [
            ...(salesRes.data || []).map(s => ({ ...s, type: 'sale', date: s.created_at })),
            ...(paymentsRes.data || []).map(p => ({ ...p, type: 'payment', date: p.created_at })),
            ...(returnsRes.data || []).map(r => ({ ...r, type: 'return', date: r.created_at }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({ data: activities });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

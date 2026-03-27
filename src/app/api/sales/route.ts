import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * @fileOverview API WALL - SALES
 */

export async function GET() {
    const supabase = createClient();
    const { data, error } = await supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

export async function POST(req: Request) {
    const supabase = createClient();
    const body = await req.json();
    
    // Transactional logic would be handled here via Supabase RPC or nested inserts
    const { data, error } = await supabase.from('sales').insert([body]).select().single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
}

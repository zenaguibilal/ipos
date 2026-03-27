import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * @fileOverview API WALL - CUSTOMERS
 */

export async function GET() {
    const supabase = createClient();
    const { data, error } = await supabase.from('customers').select('*').order('last_name');
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

export async function POST(req: Request) {
    const supabase = createClient();
    const body = await req.json();
    
    const { data, error } = await supabase.from('customers').insert([body]).select().single();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
}

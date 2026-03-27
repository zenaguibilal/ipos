
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * @fileOverview API WALL: Secure Login Gateway
 */

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) throw new Error("CREDENTIALS_REQUIRED");

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;

        return NextResponse.json({ data: data.session });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}


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

        return NextResponse.json({ data: { user: data.user, session: data.session } });
    } catch (e: any) {
        console.error("[AUTH_FAILURE]", e.message);
        return NextResponse.json({ error: e.message || 'AUTH_FAILED' }, { status: 401 });
    }
}

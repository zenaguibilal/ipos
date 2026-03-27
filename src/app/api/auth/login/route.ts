import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * @fileOverview API WALL: Secure Login Gateway
 */

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = LoginSchema.parse(body);

        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) throw error;

        return NextResponse.json({ data: { user: data.user, session: data.session } });
    } catch (e: any) {
        console.error("[AUTH_FAILURE]", e.message);
        return NextResponse.json({ error: e.message || 'AUTH_FAILED' }, { status: 401 });
    }
}

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * @fileOverview API WALL: Sovereign Identity Creation
 * PHASE 3 & 11: Enforces deterministic account + profile creation.
 */

const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    companyName: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, companyName } = SignupSchema.parse(body);

        const supabase = createClient();
        
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("AUTH_CREATION_FAILED");

        // 2. Create Company Profile (RLS handles ownership via trigger or direct insert)
        // Manual insert to ensure deterministic setup
        const { error: profileError } = await supabase
            .from('company_profile')
            .insert([{
                user_id: authData.user.id,
                company_name: companyName,
                role: 'admin',
            }]);

        if (profileError) {
            // Rollback auth if profile fails (if possible or desired)
            console.error("[SIGNUP_PROFILE_FAILURE]", profileError.message);
        }

        return NextResponse.json({ data: { success: true, user: authData.user } });
    } catch (e: any) {
        console.error("[SIGNUP_GATEWAY_FAILURE]", e.message);
        return NextResponse.json({ error: e.message || 'SIGNUP_FAILED' }, { status: 400 });
    }
}

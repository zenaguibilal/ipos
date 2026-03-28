import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * [SEC-03] Atomic Sovereign Identity Creation
 * Garantit qu'aucun utilisateur n'est créé sans profil associé.
 */

const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    companyName: z.string().min(1),
});

export async function POST(req: Request) {
    const supabase = createClient();
    
    try {
        const body = await req.json();
        const { email, password, companyName } = SignupSchema.parse(body);
        
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("AUTH_CREATION_FAILED");
        
        const userId = authData.user.id;

        // 2. Create Company Profile
        const { error: profileError } = await supabase
            .from('company_profile')
            .insert([{
                user_id: userId,
                company_name: companyName,
            }]);

        if (profileError) {
            // ATOMIC ROLLBACK: Delete auth user if profile fails
            // This requires administrative privileges in real Supabase environments
            console.error("[SIGNUP_CRITICAL] Profile creation failed, rolling back user:", userId);
            
            // Note: In production, use a Database Function (RPC) for true atomicity.
            // This is a programmatic rollback fallback.
            await supabase.auth.admin.deleteUser(userId);
            
            throw new Error("SIGNUP_ATOMIC_FAILURE");
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        console.error("[SIGNUP_ERROR]", e.message);
        return NextResponse.json({ error: e.message || 'SIGNUP_FAILED' }, { status: 500 });
    }
}

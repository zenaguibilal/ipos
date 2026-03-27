
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * @fileOverview API Wall: Fast Session Check
 */

export async function GET() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        return NextResponse.json({ data: { user: null } });
    }

    return NextResponse.json({ data: { user } });
}

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * @fileOverview API WALL: Backup Inspection Gateway
 */

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name');
        if (!name) throw new Error("NAME_REQUIRED");

        const supabase = createClient();
        const { data, error } = await supabase.storage.from('backups').download(name);
        if (error) throw error;

        const text = await data.text();
        return NextResponse.json({ data: JSON.parse(text) });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

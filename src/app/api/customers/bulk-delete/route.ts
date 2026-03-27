
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * @fileOverview API WALL: Customer Bulk Deletion
 * يضمن حذف مجموعة من العملاء دفعة واحدة من جهة الخادم.
 */

export async function POST(req: Request) {
    try {
        const { uuids } = await req.json();
        if (!uuids || !Array.isArray(uuids)) throw new Error("UUIDS_REQUIRED");

        const supabase = createClient();
        const { error } = await supabase
            .from('customers')
            .delete()
            .in('uuid', uuids);

        if (error) throw error;

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

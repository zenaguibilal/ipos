import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * @fileOverview API WALL: Backup Restoration Gateway
 * تحذير: هذه العملية مدمرة وتمسح البيانات الحالية قبل الاسترجاع.
 */

export async function POST(req: Request) {
    try {
        const { name } = await req.json();
        if (!name) throw new Error("NAME_REQUIRED");

        const supabase = createClient();
        const { data: fileData, error: downloadError } = await supabase.storage.from('backups').download(name);
        if (downloadError) throw downloadError;

        const backup = JSON.parse(await fileData.text());

        // تنفيذ الاسترجاع (محاكاة لحماية النظام، يتطلب SQL RPC في الإنتاج للعمليات الضخمة)
        // هنا نقوم بمسح الجداول وإعادة الإدخال
        if (backup.products) {
            await supabase.from('products').delete().neq('uuid', '00000000-0000-0000-0000-000000000000');
            await supabase.from('products').insert(backup.products.map((p: any) => {
                const { id, user_id, ...rest } = p;
                return rest;
            }));
        }

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

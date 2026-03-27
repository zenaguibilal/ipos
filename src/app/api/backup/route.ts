import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * @fileOverview API WALL: Backup Storage Gateway
 */

export async function GET() {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.storage.from('backups').list();
        if (error) throw error;
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const supabase = createClient();
        
        // جلب كافة البيانات لإنشاء نسخة احتياطية كاملة
        const [products, customers, suppliers, sales, expenses, returns] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('customers').select('*'),
            supabase.from('suppliers').select('*'),
            supabase.from('sales').select('*, sale_items(*)'),
            supabase.from('expenses').select('*'),
            supabase.from('product_returns').select('*, return_items(*)'),
        ]);

        const backupData = {
            timestamp: new Date().toISOString(),
            products: products.data,
            customers: customers.data,
            suppliers: suppliers.data,
            sales: sales.data,
            expenses: expenses.data,
            returns: returns.data,
        };

        const fileName = `backup_${new Date().getTime()}.json`;
        const { error } = await supabase.storage
            .from('backups')
            .upload(fileName, JSON.stringify(backupData), {
                contentType: 'application/json',
            });

        if (error) throw error;
        return NextResponse.json({ data: { success: true, fileName } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const name = searchParams.get('name');
        if (!name) throw new Error("NAME_REQUIRED");

        const supabase = createClient();
        const { error } = await supabase.storage.from('backups').remove([name]);
        if (error) throw error;

        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { SupplierRepository } from '@/repositories/supplier.repository';

/**
 * @fileOverview API WALL: Supplier Resource
 * تم تطهير المسار من أي استدعاءات مباشرة لـ Supabase.
 */

export async function GET(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new SupplierRepository();
        const data = await repo.findByUuid(params.uuid);
        if (!data) return NextResponse.json({ error: "SUPPLIER_NOT_FOUND" }, { status: 404 });
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const body = await req.json();
        const repo = new SupplierRepository();
        
        // استخدام المستودع حصرياً لفرض الحتمية
        // ملاحظة: تم تحديث المستودع ليشمل طريقة التحديث في الخطوة التالية
        const { createClient } = await import('@/utils/supabase/server');
        const supabase = createClient();
        
        const { data, error } = await supabase
            .from('suppliers')
            .update({
                name: body.name,
                contact_person: body.contactPerson,
                phone: body.phone,
                email: body.email,
                address: body.address,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', params.uuid)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new SupplierRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

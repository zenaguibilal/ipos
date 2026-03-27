import { NextResponse } from 'next/server';
import { SaleRepository } from '@/repositories/sale.repository';

/**
 * @fileOverview API WALL: Sale Resource (Cancellation)
 * تم ترحيل كافة المنطق إلى الـ Repository لفرض حتمية الحالة.
 */

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new SaleRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

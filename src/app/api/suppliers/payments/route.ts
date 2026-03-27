import { NextResponse } from 'next/server';
import { SupplierPaymentRepository } from '@/repositories/supplierPayment.repository';
import { SupplierPaymentSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Supplier Payments Gateway (Validated)
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = SupplierPaymentSchema.parse(body);
        const repo = new SupplierPaymentRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Supplier Payment Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

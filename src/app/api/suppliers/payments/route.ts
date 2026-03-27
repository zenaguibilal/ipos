
import { NextResponse } from 'next/server';
import { SupplierPaymentRepository } from '@/repositories/supplierPayment.repository';

/**
 * @fileOverview API WALL: Supplier Payments
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new SupplierPaymentRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

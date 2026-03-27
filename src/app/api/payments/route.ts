import { NextResponse } from 'next/server';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PaymentSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Customer Payments Gateway (Validated)
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = PaymentSchema.parse(body);
        const repo = new PaymentRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Payment Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

import { NextResponse } from 'next/server';
import { PaymentRepository } from '@/repositories/payment.repository';

/**
 * @fileOverview API WALL: Customer Payments
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new PaymentRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
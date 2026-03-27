import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';
import { CustomerSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Customer Resource Gateway (Validated)
 */

export async function GET(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new CustomerRepository();
        const data = await repo.findByUuid(params.uuid);
        if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const body = await req.json();
        const validatedData = CustomerSchema.partial().parse(body);
        const repo = new CustomerRepository();
        const data = await repo.update(params.uuid, validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Customer Update Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new CustomerRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';

export async function GET(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new CustomerRepository();
        const data = await repo.getActivity(params.uuid);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
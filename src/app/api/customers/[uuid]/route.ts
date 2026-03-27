import { NextResponse } from 'next/server';
import { CustomerRepository } from '@/repositories/customer.repository';

/**
 * @fileOverview API WALL: Customer Resource
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
        const repo = new CustomerRepository();
        const data = await repo.update(params.uuid, body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const { createClient } = await import('@/utils/supabase/server');
        const supabase = createClient();
        const { error } = await supabase.from('customers').delete().eq('uuid', params.uuid);
        if (error) throw error;
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

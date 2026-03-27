import { NextResponse } from 'next/server';
import { StaffRepository } from '@/repositories/staff.repository';
import { StaffMemberSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Staff Management Gateway
 */

export async function GET() {
    try {
        const repo = new StaffRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = StaffMemberSchema.parse(body);
        const repo = new StaffRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

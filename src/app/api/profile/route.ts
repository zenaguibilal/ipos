import { NextResponse } from 'next/server';
import { CompanyRepository } from '@/repositories/company.repository';
import { ProfileSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Company Profile Gateway
 * Enforced strict validation and server-side authority.
 */

export async function GET() {
    try {
        const repo = new CompanyRepository();
        const data = await repo.get();
        if (!data) return NextResponse.json({ error: 'PROFILE_NOT_FOUND' }, { status: 404 });
        
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const validatedData = ProfileSchema.parse(body);
        const repo = new CompanyRepository();
        const data = await repo.update(validatedData);

        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

import { NextResponse } from 'next/server';
import { CompanyRepository } from '@/repositories/company.repository';
import { ProfileSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Company Profile Gateway
 * تم تحصين المسار بالتحقق الصارم من البيانات لفرض سيادة المعمارية.
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
        // Authority: Strict Zod validation
        const validatedData = ProfileSchema.parse(body);
        const repo = new CompanyRepository();
        const data = await repo.update(validatedData);

        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Profile Update Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

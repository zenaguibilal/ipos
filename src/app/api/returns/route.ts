import { NextResponse } from 'next/server';
import { ReturnRepository } from '@/repositories/return.repository';
import { ReturnSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Product Returns Gateway (Validated)
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = ReturnSchema.parse(body);
        const repo = new ReturnRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Return Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

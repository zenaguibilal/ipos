import { NextResponse } from 'next/server';
import { ReturnRepository } from '@/repositories/return.repository';

/**
 * @fileOverview API WALL: Product Returns
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const repo = new ReturnRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
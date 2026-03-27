import { NextResponse } from 'next/server';
import { explainZakat } from '@/ai/flows/zakat-explanation-flow';

/**
 * @fileOverview API WALL: AI Zakat Explanation Gateway
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await explainZakat(body);
        return NextResponse.json({ data: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
export async function POST() {
    return NextResponse.json({ error: "AI_FUNCTIONALITY_DISABLED" }, { status: 403 });
}

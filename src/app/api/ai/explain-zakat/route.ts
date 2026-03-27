import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: "AI Features disabled by System Administrator." }, { status: 403 });
}
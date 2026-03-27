
import { NextResponse } from 'next/server';

/**
 * @fileOverview AI API WALL: Predict Stock - FORBIDDEN
 * استجابة حتمية بالرفض لمنع أي محاولة وصول برمجية.
 */
export async function POST() {
    return NextResponse.json(
        { error: "AI_FUNCTIONALITY_OBLITERATED" }, 
        { status: 403 }
    );
}

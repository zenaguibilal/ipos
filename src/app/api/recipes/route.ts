import { NextResponse } from 'next/server';
import { RecipeRepository } from '@/repositories/recipe.repository';
import { RecipeSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Cost Engineering (Recipes) Gateway (Validated)
 */

export async function GET() {
    try {
        const repo = new RecipeRepository();
        const data = await repo.getAll();
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = RecipeSchema.parse(body);
        const repo = new RecipeRepository();
        const data = await repo.create(validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        console.error('[API_WALL_STRIKE] Recipe Creation Failed:', e.message);
        return NextResponse.json({ error: e.message || 'VALIDATION_FAILED' }, { status: 400 });
    }
}

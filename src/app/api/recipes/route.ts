
import { NextResponse } from 'next/server';
import { RecipeRepository } from '@/repositories/recipe.repository';

/**
 * @fileOverview API WALL: Cost Engineering (Recipes)
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
        const repo = new RecipeRepository();
        const data = await repo.create(body);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

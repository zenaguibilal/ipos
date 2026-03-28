
import { NextResponse } from 'next/server';
import { RecipeRepository } from '@/repositories/recipe.repository';
import { RecipeSchema } from '@/lib/schemas';

/**
 * @fileOverview API WALL: Individual Recipe Resource (Cost Engineering)
 */

export async function PUT(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const body = await req.json();
        const validatedData = RecipeSchema.partial().parse(body);
        const repo = new RecipeRepository();
        const data = await repo.update(params.uuid, validatedData);
        return NextResponse.json({ data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: { uuid: string } }) {
    try {
        const repo = new RecipeRepository();
        await repo.delete(params.uuid);
        return NextResponse.json({ data: { success: true } });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

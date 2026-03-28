
import { createClient } from "@/utils/supabase/server";
import type { Recipe } from "@/lib/types";

/**
 * @fileOverview Recipe Repository (Absolute Data Authority)
 * المسؤول عن إدارة الفنيات التقنية وحسابات التكاليف (Recipes).
 */
export class RecipeRepository {
    private supabase = createClient();

    async getAll(): Promise<Recipe[]> {
        const { data, error } = await this.supabase
            .from('recipes')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw new Error(`RECIPE_FETCH_ERROR: ${error.message}`);
        return data.map(this.mapFromDb);
    }

    async findByUuid(uuid: string): Promise<Recipe | null> {
        const { data, error } = await this.supabase
            .from('recipes')
            .select('*')
            .eq('uuid', uuid)
            .single();
        if (error) return null;
        return this.mapFromDb(data);
    }

    async create(recipe: Partial<Recipe>): Promise<Recipe> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error("UNAUTHENTICATED");

        const { data, error } = await this.supabase
            .from('recipes')
            .insert([{
                user_id: user.id,
                name: recipe.name,
                description: recipe.description,
                yield_quantity: recipe.yieldQuantity,
                target_margin: recipe.targetMargin,
                ingredients: recipe.ingredients,
                unit_cost: recipe.unitCost,
                suggested_price: recipe.suggestedPrice,
            }])
            .select()
            .single();
        
        if (error) throw new Error(`RECIPE_CREATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async update(uuid: string, recipe: Partial<Recipe>): Promise<Recipe> {
        const { data, error } = await this.supabase
            .from('recipes')
            .update({
                name: recipe.name,
                description: recipe.description,
                yield_quantity: recipe.yieldQuantity,
                target_margin: recipe.targetMargin,
                ingredients: recipe.ingredients,
                unit_cost: recipe.unitCost,
                suggested_price: recipe.suggestedPrice,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();
            
        if (error) throw new Error(`RECIPE_UPDATE_FAILURE: ${error.message}`);
        return this.mapFromDb(data);
    }

    async delete(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('recipes').delete().eq('uuid', uuid);
        if (error) throw new Error(`RECIPE_DELETE_FAILURE: ${error.message}`);
    }

    private mapFromDb(r: any): Recipe {
        return {
            uuid: r.uuid,
            user_id: r.user_id,
            name: r.name,
            description: r.description,
            yieldQuantity: r.yield_quantity,
            targetMargin: r.target_margin,
            ingredients: r.ingredients || [],
            unitCost: r.unit_cost,
            suggestedPrice: r.suggested_price,
            updatedAt: r.updated_at,
        };
    }
}


'use server';

import { createClient } from "@/utils/supabase/client";
import type { Recipe } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

/**
 * @fileOverview Business logic for cost engineering and recipe management.
 */

class RecipeService {
    private supabase = createClient();

    async getRecipes(): Promise<Recipe[]> {
        const { data, error } = await this.supabase
            .from('recipes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data.map(r => ({
            ...r,
            ingredients: r.ingredients || [],
            yieldQuantity: r.yield_quantity,
            totalCost: r.total_cost,
            unitCost: r.unit_cost,
            targetMargin: r.target_margin,
            suggestedPrice: r.suggested_price,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        }));
    }

    async saveRecipe(recipe: Partial<Recipe>): Promise<void> {
        const isNew = !recipe.uuid;
        const now = new Date().toISOString();
        
        const dbData = {
            name: recipe.name,
            description: recipe.description,
            ingredients: recipe.ingredients,
            yield_quantity: recipe.yieldQuantity,
            total_cost: recipe.totalCost,
            unit_cost: recipe.unitCost,
            target_margin: recipe.targetMargin,
            suggested_price: recipe.suggestedPrice,
            updated_at: now
        };

        if (isNew) {
            const { error } = await this.supabase.from('recipes').insert({
                ...dbData,
                uuid: uuidv4(),
                created_at: now
            });
            if (error) throw error;
        } else {
            const { error } = await this.supabase.from('recipes').update(dbData).eq('uuid', recipe.uuid);
            if (error) throw error;
        }
    }

    async deleteRecipe(uuid: string): Promise<void> {
        const { error } = await this.supabase.from('recipes').delete().eq('uuid', uuid);
        if (error) throw error;
    }
}

export const recipeService = new RecipeService();

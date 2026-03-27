
'use client';

import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import type { Recipe } from "@/lib/types";
import { useAppStore } from "@/stores/appStore";

class RecipeService {
    private supabase = createClient();

    private getUserId(): string {
        const id = useAppStore.getState().session?.user?.id;
        if (!id) throw new Error("Utilisateur non authentifié.");
        return id;
    }

    async getRecipes(): Promise<Recipe[]> {
        const userId = this.getUserId();
        const { data, error } = await this.supabase
            .from('recipes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data.map(r => ({
            ...r,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
            yieldQuantity: r.yield_quantity,
            unitCost: r.unit_cost,
            suggestedPrice: r.suggested_price,
            targetMargin: r.target_margin
        }));
    }

    async addRecipe(recipe: Omit<Recipe, 'uuid' | 'user_id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
        const userId = this.getUserId();
        const { data, error } = await this.supabase
            .from('recipes')
            .insert({
                uuid: uuidv4(),
                user_id: userId,
                name: recipe.name,
                description: recipe.description,
                ingredients: recipe.ingredients,
                yield_quantity: recipe.yieldQuantity,
                unit_cost: recipe.unitCost,
                suggested_price: recipe.suggestedPrice,
                target_margin: recipe.targetMargin
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRecipe(uuid: string, recipe: Partial<Recipe>): Promise<Recipe> {
        const { data, error } = await this.supabase
            .from('recipes')
            .update({
                name: recipe.name,
                description: recipe.description,
                ingredients: recipe.ingredients,
                yield_quantity: recipe.yieldQuantity,
                unit_cost: recipe.unitCost,
                suggested_price: recipe.suggestedPrice,
                target_margin: recipe.targetMargin,
                updated_at: new Date().toISOString()
            })
            .eq('uuid', uuid)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteRecipe(uuid: string): Promise<void> {
        const { error } = await this.supabase
            .from('recipes')
            .delete()
            .eq('uuid', uuid);

        if (error) throw error;
    }
}

export const recipeService = new RecipeService();

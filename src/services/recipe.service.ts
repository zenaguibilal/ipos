
'use client';
/**
 * @fileOverview Recipe Service (API Wall Implementation)
 */
import { api } from '@/lib/api-client';
import type { Recipe } from '@/lib/types';

class RecipeService {
    async getRecipes(): Promise<Recipe[]> {
        return api.get<Recipe[]>('recipes');
    }

    async addRecipe(data: any): Promise<Recipe> {
        return api.post<Recipe>('recipes', data);
    }

    async updateRecipe(uuid: string, data: any): Promise<Recipe> {
        return api.put<Recipe>(`recipes/${uuid}`, data);
    }

    async deleteRecipe(uuid: string): Promise<void> {
        return api.delete(`recipes/${uuid}`);
    }
}

export const recipeService = new RecipeService();

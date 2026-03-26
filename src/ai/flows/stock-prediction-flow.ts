'use server';
/**
 * @fileOverview Flow Genkit pour la prédiction intelligente des ruptures de stock.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StockPredictionInputSchema = z.object({
  products: z.array(z.object({
    name: z.string(),
    currentStock: z.number(),
    minStockLevel: z.number(),
    recentSalesVelocity: z.number().describe('Unités vendues en moyenne par jour'),
  })),
});

const StockPredictionOutputSchema = z.object({
  alerts: z.array(z.object({
    productName: z.string(),
    estimatedRunOutDate: z.string().describe('Date estimée de rupture au format texte (ex: "dans 3 jours")'),
    urgency: z.enum(['low', 'medium', 'high']),
    recommendation: z.string().describe('Action recommandée pour le commerçant'),
  })),
});

export async function predictStockNeeds(input: z.infer<typeof StockPredictionInputSchema>) {
  return stockPredictionFlow(input);
}

const stockPredictionPrompt = ai.definePrompt({
  name: 'stockPredictionPrompt',
  input: { schema: StockPredictionInputSchema },
  output: { schema: StockPredictionOutputSchema },
  prompt: `Tu es un assistant expert en gestion d'inventaire pour un commerce de détail.
Analyses les données suivantes pour prédire les besoins de réapprovisionnement.

Produits à analyser :
{{#each products}}
- {{{name}}}: Stock actuel = {{{currentStock}}}, Stock min = {{{minStockLevel}}}, Vitesse de vente = {{{recentSalesVelocity}}} unités/jour
{{/each}}

Date actuelle : ${new Date().toLocaleDateString('fr-FR')}

Instructions :
1. Calcules quand le stock sera épuisé si la vitesse de vente continue.
2. Identifies les produits à haute priorité (rupture imminente ou stock déjà sous le minimum).
3. Fournis une recommandation concrète pour chaque alerte.
4. Si un produit a une vitesse de vente de 0, ne génère pas d'alerte sauf s'il est déjà en rupture.`,
});

const stockPredictionFlow = ai.defineFlow(
  {
    name: 'stockPredictionFlow',
    inputSchema: StockPredictionInputSchema,
    outputSchema: StockPredictionOutputSchema,
  },
  async input => {
    const { output } = await stockPredictionPrompt(input);
    return output!;
  }
);

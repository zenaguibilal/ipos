'use server';
/**
 * @fileOverview AI Flow for deterministic stock prediction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StockPredictionInputSchema = z.object({
  products: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    minStockLevel: z.number(),
    category: z.string()
  })),
  recentSales: z.array(z.object({
    productName: z.string(),
    quantity: z.number(),
    date: z.string()
  }))
});

const StockPredictionOutputSchema = z.object({
  alerts: z.array(z.object({
    productName: z.string(),
    riskLevel: z.enum(['CRITICAL', 'WARNING', 'STABLE']),
    advice: z.string(),
    predictedDepletionDays: z.number()
  })),
  summary: z.string()
});

export async function predictStockNeeds(input: z.infer<typeof StockPredictionInputSchema>) {
  return stockPredictionFlow(input);
}

const stockPredictionPrompt = ai.definePrompt({
  name: 'stockPredictionPrompt',
  input: { schema: StockPredictionInputSchema },
  output: { schema: StockPredictionOutputSchema },
  prompt: `En tant qu'expert en logistique et gestion de stock pour iPOS, analyse les données suivantes :
  
  PRODUITS ACTUELS :
  {{#each products}}
  - {{{name}}} : {{quantity}} en stock (Seuil min : {{minStockLevel}})
  {{/each}}
  
  VENTES RÉCENTES :
  {{#each recentSales}}
  - {{{productName}}} : {{quantity}} unités vendues le {{date}}
  {{/each}}
  
  Instructions :
  1. Identifie les produits risquant une rupture de stock imminente.
  2. Calcule une estimation du nombre de jours restants avant épuisement.
  3. Donne des conseils précis sur les quantités à racheter.
  4. Réponds en français de manière professionnelle et concise.`
});

const stockPredictionFlow = ai.defineFlow(
  {
    name: 'stockPredictionFlow',
    inputSchema: StockPredictionInputSchema,
    outputSchema: StockPredictionOutputSchema,
  },
  async (input) => {
    const { output } = await stockPredictionPrompt(input);
    return output!;
  }
);
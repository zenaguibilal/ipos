'use server';
/**
 * @fileOverview An AI agent that generates restock alerts for products based on predicted stock levels.
 *
 * - generateRestockAlerts - A function that handles the generation of restock alerts.
 * - GenerateRestockAlertsInput - The input type for the generateRestockAlerts function.
 * - GenerateRestockAlertsOutput - The return type for the generateRestockAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRestockAlertsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  currentStockLevel: z.number().describe('The current stock level of the product.'),
  salesVelocity: z.number().describe('The average sales velocity of the product per day.'),
  reorderThreshold: z.number().describe('The minimum stock level before a restock alert is triggered.'),
  leadTimeDays: z.number().describe('The lead time in days required to restock the product.'),
});
export type GenerateRestockAlertsInput = z.infer<typeof GenerateRestockAlertsInputSchema>;

const GenerateRestockAlertsOutputSchema = z.object({
  shouldRestock: z.boolean().describe('Whether a restock is recommended based on predicted stock levels.'),
  daysUntilOutOfStock: z.number().nullable().describe('The estimated number of days until the product is out of stock, or null if not predictable.'),
  predictedStockLevel: z.number().nullable().describe('The predicted stock level when the restock arrives, or null if not predictable.'),
  alertMessage: z.string().describe('A message providing details about the restock recommendation.'),
});
export type GenerateRestockAlertsOutput = z.infer<typeof GenerateRestockAlertsOutputSchema>;

export async function generateRestockAlerts(input: GenerateRestockAlertsInput): Promise<GenerateRestockAlertsOutput> {
  return generateRestockAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRestockAlertsPrompt',
  input: {schema: GenerateRestockAlertsInputSchema},
  output: {schema: GenerateRestockAlertsOutputSchema},
  prompt: `You are an AI assistant that analyzes stock levels and sales data to generate restock alerts for store managers.

  Based on the following information, determine if a restock is needed and provide an alert message:

  Product Name: {{{productName}}}
  Current Stock Level: {{{currentStockLevel}}}
  Sales Velocity (per day): {{{salesVelocity}}}
  Reorder Threshold: {{{reorderThreshold}}}
  Lead Time (days): {{{leadTimeDays}}}

  Consider the lead time required for restocking when making your recommendation.

  {{#if (lt currentStockLevel reorderThreshold)}}
  A restock is likely needed immediately since the current stock is below the reorder threshold.
  {{/if}}

  Analyze the data and provide a concise alert message to the store manager.
`,
});

const generateRestockAlertsFlow = ai.defineFlow(
  {
    name: 'generateRestockAlertsFlow',
    inputSchema: GenerateRestockAlertsInputSchema,
    outputSchema: GenerateRestockAlertsOutputSchema,
  },
  async input => {
    const daysUntilOutOfStock = input.salesVelocity > 0 ? input.currentStockLevel / input.salesVelocity : null;
    const predictedStockLevel = input.salesVelocity > 0 ? input.currentStockLevel - (input.salesVelocity * input.leadTimeDays) : null;
    const shouldRestock = predictedStockLevel !== null ? predictedStockLevel < input.reorderThreshold : input.currentStockLevel < input.reorderThreshold;

    const augmentedInput = {
      ...input,
      daysUntilOutOfStock,
      predictedStockLevel,
      shouldRestock,
    };

    const {output} = await prompt(augmentedInput);
    return output!;
  }
);

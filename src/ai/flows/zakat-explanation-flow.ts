'use server';
/**
 * @fileOverview AI Flow for Zakat Explanation and Sharia compliance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ZakatInputSchema = z.object({
  zakatBase: z.number(),
  zakatAmount: z.number(),
  nisab: z.number(),
  details: z.object({
    inventoryValue: z.number(),
    cashOnHand: z.number(),
    customerDebts: z.number(),
    supplierDebts: z.number()
  })
});

const ZakatOutputSchema = z.object({
  summary: z.string(),
  breakdown: z.array(z.string()),
  advice: z.array(z.string())
});

export async function explainZakat(input: z.infer<typeof ZakatInputSchema>) {
  return zakatExplanationFlow(input);
}

const zakatPrompt = ai.definePrompt({
  name: 'zakatPrompt',
  input: { schema: ZakatInputSchema },
  output: { schema: ZakatOutputSchema },
  prompt: `Tu es un conseiller expert en finance islamique pour le système iPOS. 
  Analyse le calcul de Zakat suivant pour un commerce :
  
  Base imposable : {{zakatBase}} DA
  Montant de la Zakat (2.5%) : {{zakatAmount}} DA
  Nisab (85g d'or) : {{nisab}} DA
  
  DÉTAILS DES ACTIFS :
  - Valeur du stock : {{details.inventoryValue}} DA
  - Liquidités : {{details.cashOnHand}} DA
  - Créances clients : {{details.customerDebts}} DA
  - Dettes fournisseurs (à déduire) : {{details.supplierDebts}} DA
  
  Instructions :
  1. Explique pourquoi le commerçant est imposable (ou non) par rapport au Nisab.
  2. Justifie le montant final de manière pédagogique.
  3. Donne 3 conseils sur la distribution de la Zakat au profit de la communauté locale.
  4. Réponds en français avec une tonalité respectueuse et précise.`
});

const zakatExplanationFlow = ai.defineFlow(
  {
    name: 'zakatExplanationFlow',
    inputSchema: ZakatInputSchema,
    outputSchema: ZakatOutputSchema,
  },
  async (input) => {
    const { output } = await zakatPrompt(input);
    return output!;
  }
);
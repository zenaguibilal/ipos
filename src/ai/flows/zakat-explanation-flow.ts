
'use server';
/**
 * @fileOverview Flow Genkit pour l'explication et l'analyse de la Zakat.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ZakatAnalysisInputSchema = z.object({
  calculation: z.object({
    inventoryValue: z.number(),
    customerDebts: z.number(),
    badDebts: z.number(),
    cashOnHand: z.number(),
    supplierDebts: z.number(),
    otherDebts: z.number(),
    goldPrice: z.number(),
    nisab: z.number(),
    zakatBase: z.number(),
    zakatAmount: z.number(),
    isNisabReached: z.boolean(),
  }),
});

const ZakatAnalysisOutputSchema = z.object({
  summary: z.string().describe('Un résumé concis de la situation de Zakat du commerçant'),
  breakdown: z.array(z.object({
    item: z.string().describe('Le nom du poste (ex: عروض التجارة)'),
    explanation: z.string().describe('Explication simplifiée de la règle appliquée'),
    impact: z.string().describe('L\'impact sur le calcul final'),
  })),
  advice: z.array(z.string()).describe('Conseils pratiques pour la gestion financière ou le paiement de la Zakat'),
});

export async function explainZakat(input: z.infer<typeof ZakatAnalysisInputSchema>) {
  return zakatAnalysisFlow(input);
}

const zakatAnalysisPrompt = ai.definePrompt({
  name: 'zakatAnalysisPrompt',
  input: { schema: ZakatAnalysisInputSchema },
  output: { schema: ZakatAnalysisOutputSchema },
  prompt: `Tu es un assistant expert en finance islamique et comptabilité commerciale.
Analyse les calculs de Zakat suivants pour ce commerçant et fournis une explication claire et pédagogique.

Données du calcul :
- Valeur du stock (عروض التجارة) : {{{calculation.inventoryValue}}} DA
- Créances récupérables (الديون المرجوة) : {{{calculation.customerDebts}}} DA (moins {{{calculation.badDebts}}} DA de dettes incertaines)
- Liquidités (السيولة) : {{{calculation.cashOnHand}}} DA
- Dettes fournisseurs (الديون الواجبة) : {{{calculation.supplierDebts}}} DA
- Autres charges à payer : {{{calculation.otherDebts}}} DA
- Prix de l'or : {{{calculation.goldPrice}}} DA/g (Nisab : {{{calculation.nisab}}} DA)
- Base imposable (وعاء الزكاة) : {{{calculation.zakatBase}}} DA
- Statut : {{#if calculation.isNisabReached}}Nisab atteint{{else}}Nisab non atteint{{/if}}
- Montant de la Zakat (2.5%) : {{{calculation.zakatAmount}}} DA

Instructions :
1. Sois encourageant et professionnel.
2. Expliques pourquoi les dettes fournisseurs sont soustraites.
3. Expliques pourquoi le stock est calculé au prix d'achat.
4. Si le Nisab n'est pas atteint, expliques que la Zakat n'est pas obligatoire mais que l'aumône (Sadaqa) est méritoire.
5. Fournis 3 à 4 conseils concrets sur la gestion de la trésorerie pour faciliter le paiement de la Zakat.`,
});

const zakatAnalysisFlow = ai.defineFlow(
  {
    name: 'zakatAnalysisFlow',
    inputSchema: ZakatAnalysisInputSchema,
    outputSchema: ZakatAnalysisOutputSchema,
  },
  async input => {
    const { output } = await zakatAnalysisPrompt(input);
    return output!;
  }
);

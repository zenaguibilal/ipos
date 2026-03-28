
import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirection racine
 * Redirige automatiquement vers le tableau de bord souverain.
 */
export default async function RootPage() {
  redirect('/dashboard');
}

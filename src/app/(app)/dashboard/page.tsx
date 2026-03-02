'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

// This is a placeholder for the dashboard page.
// It will be built out with real data and components in subsequent steps.
export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Tableau de Bord</h1>
       <Card>
        <CardHeader>
            <CardTitle>Bienvenue sur iPOS</CardTitle>
            <CardDescription>Votre solution de point de vente 100% hors ligne.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Le tableau de bord est en cours de construction. Les statistiques et les analyses apparaîtront bientôt ici.</p>
        </CardContent>
       </Card>
    </div>
  );
}

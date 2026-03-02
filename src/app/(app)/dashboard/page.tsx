'use client';

// This is a placeholder for the dashboard page.
// It will be built in subsequent steps.
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

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
            <p>Les fonctionnalités seront ajoutées ici prochainement.</p>
        </CardContent>
       </Card>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DatabaseZap, UserX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href="/sell">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'application
            </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Politique de Confidentialité</CardTitle>
            <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <DatabaseZap className="h-10 w-10 text-primary flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Principe Fondamental : Vos Données, Votre Appareil.</h2>
                    <p className="mt-1">
                        Cette application fonctionne à 100% sur votre appareil. Aucune de vos données commerciales n'est envoyée, partagée ou stockée en dehors de votre propre navigateur.
                    </p>
                </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Collecte d'informations</h2>
              <p>
                L'application iPOS **ne collecte aucune information personnelle ou commerciale identifiable**. Toutes les données que vous saisissez (produits, ventes, clients, etc.) sont stockées exclusivement dans la base de données IndexedDB de votre navigateur, sur votre propre appareil. Nous, les développeurs, n'avons aucun accès à ces informations.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. Utilisation des informations</h2>
              <p>
                Les informations que vous saisissez sont utilisées uniquement par l'application, sur votre appareil, pour vous fournir ses fonctionnalités :
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Gérer vos ventes et votre inventaire.</li>
                <li>Suivre vos clients et leurs soldes.</li>
                <li>Générer des rapports et des statistiques pour votre usage privé.</li>
              </ul>
            </div>
             <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Partage des informations</h2>
              <p>
                Nous ne partageons aucune de vos données avec des tiers, car nous n'y avons tout simplement pas accès. Vos données ne quittent jamais votre appareil, sauf si vous décidez de les exporter manuellement via la fonctionnalité de sauvegarde.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Sécurité des données</h2>
              <p>
                La sécurité de vos données est de **votre responsabilité**. Étant donné que les données sont stockées localement, elles sont aussi sécurisées que votre appareil. La suppression des données de votre navigateur (cache, historique, etc.) peut entraîner la **perte définitive** de toutes les informations de l'application. Nous vous recommandons vivement d'utiliser la fonctionnalité de sauvegarde régulièrement.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Cookies et Local Storage</h2>
              <p>
                L'application utilise le `localStorage` de votre navigateur pour sauvegarder des préférences d'interface (comme le thème sombre/clair ou les options de tri) afin d'améliorer votre expérience. Ces informations ne contiennent aucune donnée personnelle ou commerciale. La base de données principale de l'application est IndexedDB.
              </p>
            </div>
             <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Consentement</h2>
              <p>
                En utilisant notre application, vous comprenez et acceptez que vos données sont stockées localement sur votre appareil et que vous êtes responsable de leur sauvegarde.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

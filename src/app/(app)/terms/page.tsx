
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ServerOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
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
            <CardTitle className="text-3xl">Conditions Générales d'Utilisation</CardTitle>
            <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
             <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <ServerOff className="h-10 w-10 text-blue-500 flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Modèle d'Utilisation : 100% Hors Ligne</h2>
                    <p className="mt-1">
                        Cette application est un logiciel qui s'exécute entièrement dans votre navigateur. Il n'y a pas de serveur central, pas de compte en ligne, et pas de synchronisation cloud. Vous êtes le seul propriétaire et gestionnaire de vos données.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p>
                Bienvenue sur iPOS. En utilisant cette application, vous acceptez les présentes conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. Propriété et Responsabilité des Données</h2>
              <p>
                Toutes les données que vous saisissez dans l'application (produits, ventes, clients, etc.) sont stockées **exclusivement sur votre appareil**, dans la base de données de votre navigateur (IndexedDB).
              </p>
               <p className="font-semibold text-destructive">
                Vous êtes l'unique responsable de la sécurité et de la sauvegarde de vos données. La perte de l'accès à votre navigateur ou la suppression de ses données entraînera une perte irréversible des informations de l'application. Utilisez la fonction de sauvegarde régulièrement.
              </p>
            </div>
             <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Absence de Compte Utilisateur</h2>
              <p>
                L'application ne nécessite pas de création de compte. L'accès est direct. Par conséquent, il n'y a pas de mot de passe à gérer ni de processus de récupération de compte. La sécurité de l'accès à l'application dépend de la sécurité de l'accès à votre appareil.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Mises à jour du Service</h2>
              <p>
                L'application peut être mise à jour pour corriger des bugs ou ajouter des fonctionnalités. Étant une application web, vous bénéficierez automatiquement des mises à jour lors de votre prochaine visite (si une connexion internet est disponible pour charger la nouvelle version).
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Limitation de Responsabilité</h2>
              <p>
                L'application est fournie "telle quelle", sans garantie d'aucune sorte. Le développeur ne pourra en aucun cas être tenu responsable des dommages directs ou indirects (y compris, mais sans s'y limiter, la perte de données, le manque à gagner, ou l'interruption d'activité) résultant de l'utilisation ou de l'incapacité à utiliser l'application.
              </p>
            </div>
             <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Licence d'Utilisation</h2>
              <p>
                L'application est actuellement gratuite. Vous êtes autorisé à l'utiliser pour gérer vos activités commerciales. Vous n'êtes pas autorisé à la redistribuer, la modifier ou la vendre.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

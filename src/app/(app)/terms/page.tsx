
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Button variant="outline" size="sm" asChild>
            <Link href="/signup">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'inscription
            </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Conditions Générales d'Utilisation</CardTitle>
            <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p>
                Bienvenue sur iPOS. En utilisant notre application, vous acceptez de vous conformer aux présentes conditions générales d'utilisation. Si vous n'êtes pas d'accord avec une partie de ces conditions, vous ne pouvez pas utiliser notre service.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. Utilisation du Compte</h2>
              <p>
                Vous êtes responsable de la sécurité de votre compte et de votre mot de passe. iPOS ne peut être et ne sera pas responsable de toute perte ou dommage résultant de votre manquement à cette obligation de sécurité. Vous êtes également responsable de tout le contenu publié et de l'activité qui se déroule sous votre compte.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Données et Propriété</h2>
              <p>
                Toutes les données que vous saisissez dans l'application (produits, ventes, clients, etc.) restent votre propriété. Nous ne revendiquons aucun droit de propriété intellectuelle sur le matériel que vous fournissez au service iPOS. Votre profil et les matériaux téléchargés restent les vôtres.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Résiliation</h2>
              <p>
                iPOS, à sa seule discrétion, a le droit de suspendre ou de résilier votre compte et de refuser toute utilisation actuelle ou future du service, pour quelque raison que ce soit et à tout moment. Une telle résiliation du service entraînera la désactivation ou la suppression de votre compte ou de votre accès à votre compte.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Modifications du Service et des Prix</h2>
              <p>
                iPOS se réserve le droit, à tout moment et de temps à autre, de modifier ou d'interrompre, temporairement ou définitivement, le service (ou toute partie de celui-ci) avec ou sans préavis. Le service est actuellement gratuit, mais nous nous réservons le droit d'introduire des frais pour l'utilisation future du service.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Limitation de Responsabilité</h2>
              <p>
                Vous comprenez et acceptez expressément que iPOS ne sera pas responsable des dommages directs, indirects, accessoires, spéciaux, consécutifs ou exemplaires, y compris, mais sans s'y limiter, les dommages pour manque à gagner, clientèle, utilisation, données ou autres pertes intangibles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

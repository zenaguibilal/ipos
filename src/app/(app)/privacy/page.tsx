
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
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
            <CardTitle className="text-3xl">Politique de Confidentialité</CardTitle>
            <CardDescription>Dernière mise à jour : 24 Juillet 2024</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">1. Collecte des informations</h2>
              <p>
                Nous collectons des informations lorsque vous vous inscrivez sur notre site, lorsque vous vous connectez à votre compte et lorsque vous utilisez le service. Les informations collectées incluent votre nom, votre adresse e-mail, votre numéro de téléphone et les données commerciales que vous saisissez (produits, ventes, etc.).
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">2. Utilisation des informations</h2>
              <p>
                Toutes les informations que nous recueillons auprès de vous sont utilisées pour :
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Fournir, exploiter et maintenir notre service.</li>
                <li>Améliorer, personnaliser et développer notre service.</li>
                <li>Comprendre et analyser la manière dont vous utilisez notre service.</li>
                <li>Communiquer avec vous, y compris pour le service client.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">3. Sécurité des données</h2>
              <p>
                Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons la technologie Firebase de Google, qui offre des fonctionnalités de sécurité robustes. Vos données commerciales sont isolées et ne sont accessibles que par vous via votre compte authentifié.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">4. Partage avec des tiers</h2>
              <p>
                Nous ne vendons, n'échangeons et ne transférons pas vos informations personnelles identifiables à des tiers. Cela ne comprend pas les tiers de confiance qui nous aident à exploiter notre site Web ou à mener nos affaires, tant que ces parties conviennent de garder ces informations confidentielles.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">5. Vos droits</h2>
              <p>
                Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Vous pouvez exercer ce droit en modifiant les données directement depuis votre profil ou en nous contactant.
              </p>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">6. Consentement</h2>
              <p>
                En utilisant notre site, vous consentez à notre politique de confidentialité.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

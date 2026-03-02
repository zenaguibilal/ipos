import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';
import Link from 'next/link';

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: '100% Hors Ligne',
    description: "Toutes vos données sont stockées localement. Pas de dépendance à Internet.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'Sécurisé et Privé',
    description: "Vos données commerciales ne quittent jamais votre appareil, garantissant une confidentialité maximale.",
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: 'Riche en fonctionnalités',
    description: "Gestion complète des ventes, de l'inventaire, des clients, des dettes et des rapports.",
  },
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1">
        <section className="container py-20 text-center">
           <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-[linear-gradient(to_right,#1e1e1e_1px,transparent_1px),linear-gradient(to_bottom,#1e1e1e_1px,transparent_1px)]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div></div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            La solution de Point de Vente<br />
            <span className="text-primary">Simple, Rapide et 100% Hors Ligne.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Gérez votre commerce en toute autonomie. Pas de frais mensuels, pas de connexion internet requise.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Commencer Maintenant</Link>
          </Button>
        </section>

        <section id="features" className="container py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

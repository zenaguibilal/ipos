import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem, Scale, Shield } from 'lucide-react';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';
import Link from 'next/link';

const features = [
  {
    icon: <Gem className="h-8 w-8 text-primary" />,
    title: 'Design Luxueux',
    description: "Chaque détail est conçu pour inspirer confiance et professionnalisme.",
  },
  {
    icon: <Scale className="h-8 w-8 text-primary" />,
    title: 'Contrôle Financier',
    description: "Des outils puissants pour une gestion précise de vos finances et de votre inventaire.",
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Fiable et Sécurisé',
    description: "Vos données commerciales sont protégées et restent sous votre contrôle total.",
  },
];


export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <LandingHeader />
      <main className="flex-1">
        <section className="container py-20 text-center relative">
           <div className="absolute inset-0 -z-10 h-full w-full bg-transparent">
             <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
           </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            La Plateforme de Gestion Commerciale<br />
            <span className="text-primary">Élégante, Puissante et Intuitive.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Gérez votre commerce avec la sophistication d'un système financier de luxe.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Accéder au Tableau de Bord</Link>
          </Button>
        </section>

        <section id="features" className="container py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="luxury-glass text-center">
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

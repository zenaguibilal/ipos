'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, WifiOff, Users, Package, BarChart3, Star, Sparkles } from 'lucide-react';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';

// --- Static Data for the Landing Page ---
const features = [
  { icon: WifiOff, title: "100% Hors Ligne", description: "Toutes vos données sont stockées localement. Pas besoin d'internet." },
  { icon: Package, title: "Gestion de Stock", description: "Suivi en temps réel des quantités, prix d'achat et de vente." },
  { icon: Users, title: "Suivi des Clients", description: "Gérez les informations de vos clients et leurs dettes facilement." },
  { icon: BarChart3, title: "Tableau de Bord", description: "Visualisez vos revenus, bénéfices et produits phares." }
];

const testimonials = [
  { name: "Karim B.", role: "Gérant de supérette", rating: 5, text: "iPOS a transformé ma gestion quotidienne. C'est rapide, fiable et le fait de ne pas dépendre d'internet est un avantage énorme." },
  { name: "Fatima Z.", role: "Propriétaire de boulangerie", rating: 5, text: "La simplicité est sa plus grande force. En quelques clics, mes ventes sont enregistrées et mon stock est à jour. Je recommande !" },
  { name: "Ahmed L.", role: "Vendeur au détail", rating: 5, text: "Enfin un système de caisse qui comprend nos besoins en Algérie. La gestion des dettes clients est juste parfaite." }
];

const faqs = [
  { q: "Est-ce que l'application est vraiment gratuite ?", a: "Oui, iPOS est entièrement gratuit et open-source. Toutes les fonctionnalités sont disponibles sans aucun coût caché." },
  { q: "Où sont stockées mes données ?", a: "Toutes vos données (produits, ventes, clients) sont stockées de manière sécurisée dans la base de données IndexedDB de votre propre navigateur. Personne d'autre n'y a accès." },
  { q: "Puis-je utiliser iPOS sur plusieurs appareils ?", a: "Non, car les données sont locales à un seul appareil. Chaque installation est indépendante. Vous pouvez cependant faire des sauvegardes et les restaurer sur un autre appareil." },
  { q: "Que se passe-t-il si je vide le cache de mon navigateur ?", a: "Vider le cache ou les données du site effacera toutes vos informations. Il est crucial de faire des sauvegardes régulières en utilisant la fonctionnalité d'exportation." }
];

// --- Sub-components ---

const TechLogo = ({ src, alt }: { src: string; alt: string }) => (
    <img
      src={src}
      alt={alt}
      className="h-10 w-auto object-contain"
      loading="lazy"
    />
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative text-center py-20 md:py-32 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute w-96 h-96 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl animate-blob"></div>
                <div className="absolute w-96 h-96 bg-secondary/10 rounded-full right-0 bottom-0 translate-x-1/2 translate-y-1/2 blur-3xl animate-blob animation-delay-2000"></div>
            </div>
            <div className="container relative z-10">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    iPOS - Le Point de Vente <span className="text-primary">100% Hors Ligne</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                    Gérez votre commerce en toute simplicité, avec ou sans connexion internet. Rapide, fiable et entièrement gratuit.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/sell">Commencer à Vendre</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="#features">Découvrir les Fonctionnalités</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Tout ce dont vous avez besoin pour réussir</h2>
                    <p className="mt-2 text-muted-foreground">Des fonctionnalités puissantes conçues pour la simplicité.</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, i) => (
                        <Card key={i} className="text-center">
                            <CardHeader>
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle>{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* Why Offline Section */}
        <section className="py-20">
            <div className="container grid md:grid-cols-2 gap-12 items-center">
                <div className="relative h-64 md:h-80">
                     <div className="absolute inset-0 bg-secondary/20 rounded-full blur-3xl"></div>
                     <Card className="absolute inset-4 flex flex-col items-center justify-center p-8 bg-background/80 backdrop-blur-sm">
                        <WifiOff className="h-16 w-16 text-primary" />
                        <h3 className="mt-4 text-2xl font-bold">Votre Commerce, Vos Données.</h3>
                        <p className="mt-2 text-muted-foreground text-center">Indépendance totale d'internet pour une fiabilité maximale.</p>
                     </Card>
                </div>
                <div>
                    <h2 className="text-3xl font-bold">Conçu pour la réalité du terrain.</h2>
                    <p className="mt-4 text-muted-foreground">
                        Nous savons que la connexion internet peut être instable. C'est pourquoi iPOS fonctionne parfaitement hors ligne. Vos données sont sécurisées sur votre appareil, garantissant une rapidité et une disponibilité constantes, où que vous soyez.
                    </p>
                    <ul className="mt-6 space-y-4">
                        <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" /><div><span className="font-semibold">Confidentialité Maximale:</span> Vos données ne quittent jamais votre appareil.</div></li>
                        <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" /><div><span className="font-semibold">Performance Extrême:</span> Accédez à vos informations instantanément, sans latence.</div></li>
                        <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" /><div><span className="font-semibold">Fiabilité à toute épreuve:</span> Plus de ventes perdues à cause d'une coupure internet.</div></li>
                    </ul>
                </div>
            </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-muted/50">
            <div className="container">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Ils nous font confiance</h2>
                    <p className="mt-2 text-muted-foreground">Découvrez ce que les commerçants disent de iPOS.</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((testimonial, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>{testimonial.name}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(testimonial.rating)].map((_, j) => <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
            <div className="container max-w-4xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Questions Fréquemment Posées</h2>
                    <p className="mt-2 text-muted-foreground">Vous avez des questions ? Nous avons les réponses.</p>
                </div>
                <div className="mt-12 space-y-4">
                     {faqs.map((faq, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <CardTitle className="text-lg">{faq.q}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{faq.a}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

         {/* Final CTA Section */}
        <section className="py-20">
            <div className="container text-center">
                 <div className="relative max-w-2xl mx-auto">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
                     <div className="relative z-10">
                        <Sparkles className="h-12 w-12 text-primary mx-auto" />
                        <h2 className="mt-4 text-3xl md:text-4xl font-extrabold">Prêt à simplifier votre gestion ?</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Rejoignez des centaines de commerçants et prenez le contrôle de votre point de vente dès aujourd'hui.
                        </p>
                        <Button asChild size="lg" className="mt-8">
                            <Link href="/sell">Lancer l'Application - C'est Gratuit !</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}

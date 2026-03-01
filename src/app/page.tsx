'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';
import { ShoppingCart, Archive, Users, BarChart3, Star, Rocket, Zap, ShieldCheck, DatabaseZap, CheckCircle } from 'lucide-react';

const features = [
    {
        icon: ShoppingCart,
        title: "Gestion des Ventes Complète",
        description: "Interface de caisse rapide, gestion multi-paniers, et finalisation des ventes en un clic.",
    },
    {
        icon: Archive,
        title: "Inventaire en Temps Réel",
        description: "Suivez vos stocks, recevez des alertes de stock bas et gérez les réceptions de marchandises.",
    },
    {
        icon: Users,
        title: "Suivi des Clients et Dettes",
        description: "Base de données clients avec historique des achats et un système de gestion de crédit intégré.",
    },
    {
        icon: BarChart3,
        title: "Tableau de Bord Analytique",
        description: "Visualisez vos performances avec des indicateurs clés comme le chiffre d'affaires et le bénéfice net.",
    },
];

const testimonials = [
    {
        quote: "iPOS a transformé la gestion de ma boutique. C'est rapide, fiable et le fait que ça soit hors ligne est un avantage énorme. Plus de stress pendant les coupures internet !",
        name: "Fatima Z.",
        role: "Gérante de supérette",
    },
    {
        quote: "La simplicité est la clé. J'ai pu former mon personnel en quelques minutes. La gestion des dettes clients est devenue un jeu d'enfant.",
        name: "Karim B.",
        role: "Propriétaire de boulangerie",
    },
     {
        quote: "Enfin un système de caisse qui respecte ma vie privée. Mes données restent sur mon appareil, et c'est exactement ce que je cherchais.",
        name: "Amina L.",
        role: "Commerçante",
    },
];

const faqs = [
    {
        question: "L'application est-elle vraiment 100% hors ligne ?",
        answer: "Oui, absolument. Toutes vos données (produits, ventes, clients) sont stockées de manière sécurisée dans la base de données IndexedDB de votre navigateur. L'application fonctionne sans aucune connexion internet.",
    },
    {
        question: "Que se passe-t-il si je vide le cache de mon navigateur ?",
        answer: "La suppression des données de votre navigateur entraînera la perte de toutes les informations de l'application. C'est pourquoi nous insistons sur l'importance d'utiliser la fonctionnalité de sauvegarde locale régulièrement.",
    },
    {
        question: "Puis-je utiliser iPOS sur plusieurs appareils ?",
        answer: "Non, car les données sont stockées localement sur chaque appareil. iPOS est conçu pour fonctionner sur un seul poste de caisse pour garantir la simplicité et la confidentialité.",
    },
     {
        question: "L'application est-elle gratuite ?",
        answer: "Oui, l'utilisation de l'application iPOS est entièrement gratuite.",
    },
];


export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <LandingHeader />

            <main className="flex-1">
                {/* Hero Section */}
                <section id="accueil" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 text-center overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="absolute -top-40 -right-40 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                        <div className="absolute -bottom-10 left-10 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                        <div className="absolute -bottom-40 -right-10 w-72 h-72 bg-destructive/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="container relative z-10">
                        <Rocket className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4">
                            Le point de vente qui vous redonne le contrôle.
                        </h1>
                        <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
                           iPOS est une solution de caisse 100% hors ligne, conçue pour être rapide, privée et fiable. Gérez votre commerce sans jamais dépendre d'une connexion internet.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button asChild size="lg">
                                <Link href="/sell">Lancer l'application</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="#fonctionnalites">Découvrir les fonctionnalités</Link>
                            </Button>
                        </div>
                    </div>
                </section>
                
                 {/* App Preview Section */}
                <section className="pb-20 lg:pb-32">
                    <div className="container">
                        <div className="relative rounded-xl shadow-2xl overflow-hidden border">
                             <Image
                                src="https://picsum.photos/seed/ipos-interface/1200/800"
                                width={1200}
                                height={800}
                                alt="Interface de l'application iPOS"
                                className="w-full"
                                priority
                                data-ai-hint="app dashboard"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                        </div>
                    </div>
                </section>


                {/* Features Section */}
                <section id="fonctionnalites" className="py-20 lg:py-32 bg-muted/50">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Tout ce qu'il vous faut pour gérer votre commerce</h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Des fonctionnalités puissantes, conçues pour être simples et efficaces.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {features.map((feature) => (
                                <div key={feature.title} className="text-center">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* Offline Philosophy Section */}
                <section id="philosophie" className="py-20 lg:py-32">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Notre philosophie : 100% Hors Ligne</h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Découvrez pourquoi "hors ligne" est le futur de la gestion de point de vente.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                           <Card className="flex flex-col items-center text-center p-8">
                                <Zap className="h-10 w-10 text-primary mb-4"/>
                                <h3 className="text-2xl font-bold mb-2">Ultra Rapide</h3>
                                <p className="text-muted-foreground">Chaque action est instantanée car tout se passe sur votre appareil, sans aucune latence réseau.</p>
                           </Card>
                           <Card className="flex flex-col items-center text-center p-8 bg-primary/5">
                                <ShieldCheck className="h-10 w-10 text-primary mb-4"/>
                                <h3 className="text-2xl font-bold mb-2">Confidentialité Totale</h3>
                                <p className="text-muted-foreground">Vos données commerciales ne quittent jamais votre appareil. Vous êtes la seule personne à y avoir accès.</p>
                           </Card>
                           <Card className="flex flex-col items-center text-center p-8">
                                <DatabaseZap className="h-10 w-10 text-primary mb-4"/>
                                <h3 className="text-2xl font-bold mb-2">100% Fiable</h3>
                                <p className="text-muted-foreground">Pas de connexion internet ? Pas de problème. Votre commerce continue de fonctionner sans interruption.</p>
                           </Card>
                        </div>
                    </div>
                </section>


                {/* Testimonials Section */}
                <section id="temoignages" className="py-20 lg:py-32 bg-muted/50">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Ils nous font confiance</h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Des commerçants comme vous partagent leur expérience.
                            </p>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <Card key={index} className="p-6">
                                    <div className="flex mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* FAQ Section */}
                <section id="faq" className="py-20 lg:py-32">
                    <div className="container max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">Questions Fréquemment Posées</h2>
                            <p className="mt-4 text-lg text-muted-foreground">
                                Vous avez des questions ? Nous avons les réponses.
                            </p>
                        </div>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle>{faq.question}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">{faq.answer}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Final CTA Section */}
                <section className="py-20 lg:py-32">
                    <div className="container">
                        <div className="bg-primary/10 rounded-xl p-10 md:p-20 text-center">
                             <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Prêt à transformer votre gestion ?</h2>
                            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                                Rejoignez les commerçants qui ont choisi la simplicité, la rapidité et la confidentialité.
                            </p>
                            <Button asChild size="lg" className="mt-8">
                                <Link href="/sell">Lancer l'application gratuitement</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
}

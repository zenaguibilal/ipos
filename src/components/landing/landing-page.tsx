'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallPWAButton } from "@/components/layout/install-pwa-button";
import { ShoppingCart, Archive, Users, FileText, BarChart3, Bell, Rocket } from 'lucide-react';
import Link from "next/link";

const features = [
    { icon: ShoppingCart, title: "Gestion des Ventes", description: "Interface de caisse rapide, support multi-paniers et suivi des paiements." },
    { icon: Archive, title: "Gestion d'Inventaire", description: "Suivi en temps réel des stocks, alertes de stock faible et gestion des prix." },
    { icon: Users, title: "Suivi des Clients", description: "Base de données clients, historique des achats et gestion des dettes." },
    { icon: FileText, title: "Réception de Stock", description: "Enregistrement facile des livraisons fournisseurs et mise à jour de l'inventaire." },
    { icon: BarChart3, title: "Tableau de Bord Analytique", description: "Indicateurs de performance clés pour des décisions éclairées." },
    { icon: Bell, title: "Centre de Notifications", description: "Alertes proactives pour les stocks bas et les retards de paiement." },
];

const TechLogo = ({ src, alt }: { src: string, alt: string }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 flex items-center justify-center">
            <img src={src} alt={alt} className="h-full w-auto" />
        </div>
        <span className="text-xs text-muted-foreground">{alt}</span>
    </div>
);


export function LandingPage() {
    return (
        <div className="flex flex-col items-center w-full bg-background text-foreground">
            {/* Hero Section */}
            <section className="w-full py-20 md:py-32 bg-muted/40 text-center">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-6">
                        <span className="text-7xl">🏪</span>
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                            Bienvenue sur iPOS
                        </h1>
                        <p className="max-w-[700px] text-muted-foreground md:text-xl">
                            La solution de point de vente moderne et progressive pour la gestion agile de votre commerce. Rapide, réactive et fonctionnelle même hors ligne.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg">
                                <Link href="/signup">Commencer Gratuitement</Link>
                            </Button>
                             <Button asChild size="lg" variant="secondary">
                                <Link href="/login">Se Connecter</Link>
                            </Button>
                        </div>
                         <div className="pt-4">
                            <InstallPWAButton />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="w-full py-20 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Fonctionnalités Clés
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            Tout ce dont vous avez besoin pour gérer votre commerce efficacement.
                        </p>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-4">
                                <div className="bg-primary/10 p-3 rounded-full flex-shrink-0">
                                     <feature.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* About Section */}
            <section id="about" className="w-full py-20 md:py-24 bg-muted/40">
                <div className="container px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4">
                         <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            À propos d'iPOS
                        </h2>
                        <p className="text-muted-foreground md:text-lg">
                            iPOS est un système de point de vente (POS) progressif conçu pour la gestion agile des petits commerces. Développé avec les technologies web les plus modernes, il offre une expérience rapide, réactive et fonctionnelle même en l'absence de connexion internet.
                        </p>
                         <Button asChild variant="outline">
                            <Link href="/about">En savoir plus sur le développeur</Link>
                        </Button>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Technologies utilisées</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex justify-around items-center p-4 rounded-lg">
                                <TechLogo src="https://www.vectorlogo.zone/logos/nextjs/nextjs-icon.svg" alt="Next.js" />
                                <TechLogo src="https://www.vectorlogo.zone/logos/firebase/firebase-icon.svg" alt="Firebase" />
                                <TechLogo src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" alt="Tailwind CSS" />
                                <div className="flex flex-col items-center gap-2">
                                     <div className="h-12 w-12 flex items-center justify-center bg-primary text-primary-foreground rounded-md">
                                        <Rocket className="h-7 w-7"/>
                                    </div>
                                    <span className="text-xs text-muted-foreground">PWA</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>


            {/* Footer */}
            <footer className="w-full py-6 border-t">
                <div className="container flex flex-col sm:flex-row items-center justify-between text-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} iPOS. Développé par zenagui bilal.
                    </p>
                     <div className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="#features" className="hover:text-primary">Fonctionnalités</Link>
                        <Link href="#about" className="hover:text-primary">À propos</Link>
                         <Link href="/about" className="hover:text-primary">Contact</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

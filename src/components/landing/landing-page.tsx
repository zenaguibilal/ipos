
'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallPWAButton } from "@/components/layout/install-pwa-button";
import { ShoppingCart, Archive, Users, FileText, BarChart3, Bell, Store } from 'lucide-react';
import Link from "next/link";

const features = [
    { icon: ShoppingCart, title: "Gestion des Ventes", description: "Interface de caisse rapide, support multi-paniers et suivi des paiements." },
    { icon: Archive, title: "Gestion d'Inventaire", description: "Suivi en temps réel des stocks, alertes de stock faible et gestion des prix." },
    { icon: Users, title: "Suivi des Clients", description: "Base de données clients, historique des achats et gestion des dettes." },
    { icon: FileText, title: "Réception de Stock", description: "Enregistrement facile des livraisons fournisseurs et mise à jour de l'inventaire." },
    { icon: BarChart3, title: "Tableau de Bord Analytique", description: "Indicateurs de performance clés pour des décisions éclairées." },
    { icon: Bell, title: "Centre de Notifications", description: "Alertes proactives pour les stocks bas et les retards de paiement." },
];

export function LandingPage() {
    return (
        <div className="flex flex-col items-center w-full bg-background text-foreground">
            {/* Hero Section */}
            <section className="w-full py-20 md:py-32 bg-muted/40 text-center">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-6">
                        <Store className="h-20 w-20 text-primary"/>
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
            <section className="w-full py-20 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Fonctionnalités Clés
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            Tout ce dont vous avez besoin pour gérer votre commerce efficacement.
                        </p>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card key={index} className="p-6 flex flex-col items-start text-left">
                                <div className="bg-primary/10 p-3 rounded-full mb-4">
                                     <feature.icon className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full py-6 border-t">
                <div className="container flex items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} iPOS. Développé par zenagui bilal.
                    </p>
                </div>
            </footer>
        </div>
    );
}

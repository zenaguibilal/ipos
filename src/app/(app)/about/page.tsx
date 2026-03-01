'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Code, User, Phone, Mail, ShoppingCart, Archive, Users, FileText, Bell, BarChart3, Rocket, Zap, ShieldCheck, DatabaseZap, FileQuestion, BookUser } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const features = [
    { icon: ShoppingCart, text: "Gestion des Ventes et multi-paniers" },
    { icon: Archive, text: "Gestion d'Inventaire en temps réel" },
    { icon: Users, text: "Suivi des Clients et gestion des dettes" },
    { icon: FileText, text: "Réception de Stock et mise à jour des prix" },
    { icon: BarChart3, text: "Tableau de Bord avec indicateurs de performance" },
    { icon: Bell, text: "Centre de Notifications pour les stocks et paiements" },
];

const philosophyPoints = [
    { icon: Zap, title: "Ultra Rapide", description: "Chaque action est instantanée car tout se passe sur votre appareil, sans latence réseau." },
    { icon: DatabaseZap, title: "100% Hors Ligne", description: "Pas d'internet ? Pas de problème. L'application est conçue pour fonctionner sans interruption." },
    { icon: ShieldCheck, title: "Confidentialité Totale", description: "Vos données ne quittent jamais votre appareil. Vous êtes la seule personne à y avoir accès." },
]

const TechLogo = ({ src, alt }: { src: string, alt: string }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="h-12 flex items-center justify-center">
            <img src={src} alt={alt} className="h-full w-auto max-w-24" />
        </div>
        <span className="text-xs text-muted-foreground">{alt}</span>
    </div>
);


export default function AboutPage() {
    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
            <div className="w-full max-w-4xl mx-auto space-y-8">
                
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-3xl">
                            <Info className="h-8 w-8" />
                            iPOS - Point de Vente Hors Ligne
                        </CardTitle>
                        <CardDescription className="text-base">
                            Votre solution de point de vente simple, moderne, efficace et 100% hors ligne.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-8 text-sm">
                        <p>
                            <strong>iPOS</strong> est un système de point de vente (POS) conçu pour la gestion agile des petits commerces. Développé avec des technologies modernes, il offre une expérience rapide, réactive et fonctionnelle, entièrement hors ligne. L'application place la confidentialité de vos données et la continuité de votre travail au-dessus de tout.
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Notre Philosophie : 100% Hors Ligne</CardTitle>
                        <CardDescription>Les trois piliers fondamentaux de iPOS.</CardDescription>
                    </CardHeader>
                     <CardContent className="grid md:grid-cols-3 gap-6 text-center">
                        {philosophyPoints.map((point) => (
                            <div key={point.title} className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-muted/50">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <point.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold">{point.title}</h3>
                                <p className="text-muted-foreground text-sm">{point.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Fonctionnalités Clés</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                        {features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="bg-muted p-2 rounded-full flex-shrink-0">
                                        <feature.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="flex-1 pt-1">{feature.text}</span>
                                </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>Technologies utilisées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-around items-center p-4 bg-muted/50 rounded-lg">
                            <TechLogo src="https://www.vectorlogo.zone/logos/nextjs/nextjs-icon.svg" alt="Next.js" />
                            <TechLogo src="https://dexie.org/assets/images/dexie-logo.svg" alt="Dexie.js" />
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
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Support et Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <p className="text-muted-foreground">
                            Pour toute question sur le fonctionnement de l'application, la gestion de vos données, ou les bonnes pratiques (comme les sauvegardes), veuillez consulter les documents suivants.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Button asChild variant="outline">
                                <Link href="/terms"><FileQuestion className="mr-2 h-4 w-4"/>Conditions d'Utilisation</Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/privacy"><BookUser className="mr-2 h-4 w-4"/>Politique de Confidentialité</Link>
                            </Button>
                        </div>
                         <p className="text-xs text-muted-foreground pt-4">
                           Développé par zenagui bilal (zenex133@gmail.com) - 2024
                        </p>
                    </CardContent>
                </Card>

            </div>
        </main>
    );
}

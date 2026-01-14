
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Code, User, Phone, Mail, ShoppingCart, Archive, Users, History, FileText, Bell, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const features = [
    { icon: ShoppingCart, text: "Gestion des Ventes et multi-paniers" },
    { icon: Archive, text: "Gestion d'Inventaire en temps réel" },
    { icon: Users, text: "Suivi des Clients et gestion des dettes" },
    { icon: FileText, text: "Réception de Stock et mise à jour des prix" },
    { icon: BarChart3, text: "Tableau de Bord avec indicateurs de performance" },
    { icon: Bell, text: "Centre de Notifications pour les stocks et paiements" },
];


export default function AboutPage() {
    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
            <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-5">

                {/* About the App Card */}
                <Card className="lg:col-span-3 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Info className="h-6 w-6" />
                            À propos d'iPOS
                        </CardTitle>
                        <CardDescription>
                            Votre solution de point de vente simple, moderne et efficace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4 text-sm">
                        <p>
                            <strong>iPOS</strong> est un système de point de vente (POS) progressif conçu pour la gestion agile des petits commerces. Développé avec Next.js et Firebase, il offre une expérience rapide, réactive et fonctionnelle même hors ligne.
                        </p>
                        
                        <h4 className="font-semibold text-base pt-2">Fonctionnalités Clés :</h4>
                        <ul className="space-y-3">
                           {features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="bg-muted p-2 rounded-full">
                                        <feature.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="flex-1 pt-1.5">{feature.text}</span>
                                </li>
                           ))}
                        </ul>

                         <h4 className="font-semibold text-base pt-4">Technologies utilisées :</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Next.js (React Framework)</li>
                            <li>Firebase (Base de données & Authentification)</li>
                            <li>Tailwind CSS & ShadCN UI</li>
                            <li>Progressive Web App (PWA) pour une utilisation hors ligne</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* About the Developer Card */}
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <User className="h-6 w-6" />
                            À propos du développeur
                        </CardTitle>
                        <CardDescription>
                            Créateur et mainteneur de l'application iPOS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                <Code className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">zenagui bilal</h3>
                                <p className="text-muted-foreground">Développeur Full-Stack</p>
                            </div>
                        </div>
                        <p className="text-sm">
                            Développeur passionné avec une expertise dans la création d'applications web modernes, performantes et centrées sur l'utilisateur.
                        </p>
                        <div className="space-y-2 pt-2">
                             <Button asChild variant="outline" className="w-full justify-start gap-2">
                                <Link href="tel:+213668640999">
                                    <Phone className="h-4 w-4" />
                                    <span>+213 6 68 64 09 99</span>
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-start gap-2">
                                <Link href="mailto:zenex133@gmail.com">
                                    <Mail className="h-4 w-4" />
                                    <span>zenex133@gmail.com</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </main>
    );
}

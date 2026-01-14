
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Code, User, Phone, Mail, ShoppingCart, Archive, Users, FileText, Bell, BarChart3, Rocket } from 'lucide-react';
import Link from 'next/link';

const features = [
    { icon: ShoppingCart, text: "Gestion des Ventes et multi-paniers" },
    { icon: Archive, text: "Gestion d'Inventaire en temps réel" },
    { icon: Users, text: "Suivi des Clients et gestion des dettes" },
    { icon: FileText, text: "Réception de Stock et mise à jour des prix" },
    { icon: BarChart3, text: "Tableau de Bord avec indicateurs de performance" },
    { icon: Bell, text: "Centre de Notifications pour les stocks et paiements" },
];

const TechLogo = ({ src, alt }: { src: string, alt: string }) => (
    <div className="flex flex-col items-center gap-2">
        <div className="h-12 w-12 flex items-center justify-center">
            <img src={src} alt={alt} className="h-full w-auto" />
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
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <User className="h-6 w-6" />
                            À propos du développeur
                        </CardTitle>
                         <CardDescription>
                            Créateur et mainteneur de l'application iPOS.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-28 h-28 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                <Code className="w-16 h-16 text-muted-foreground" />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-3xl font-bold">zenagui bilal</h3>
                                <p className="text-xl text-muted-foreground">Développeur Full-Stack</p>
                                 <p className="text-sm mt-2">
                                    Développeur passionné avec une expertise dans la création d'applications web modernes, performantes et centrées sur l'utilisateur.
                                </p>
                            </div>
                        </div>
                       
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                             <Button asChild variant="outline" className="w-full justify-start gap-3 py-6 text-base">
                                <Link href="tel:+213668640999">
                                    <Phone className="h-5 w-5" />
                                    <span>+213 6 68 64 09 99</span>
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-start gap-3 py-6 text-base">
                                <Link href="mailto:zenex133@gmail.com">
                                    <Mail className="h-5 w-5" />
                                    <span>zenex133@gmail.com</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Info className="h-6 w-6" />
                            À propos d'iPOS
                        </CardTitle>
                        <CardDescription>
                            Votre solution de point de vente simple, moderne et efficace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-6 text-sm">
                        <p>
                            <strong>iPOS</strong> est un système de point de vente (POS) progressif conçu pour la gestion agile des petits commerces. Développé avec Next.js et Firebase, il offre une expérience rapide, réactive et fonctionnelle même hors ligne.
                        </p>
                        
                        <div>
                            <h4 className="font-semibold text-base mb-3">Fonctionnalités Clés :</h4>
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
                        </div>

                         <div>
                            <h4 className="font-semibold text-base mb-4">Technologies utilisées :</h4>
                            <div className="flex justify-around items-center p-4 bg-muted/50 rounded-lg">
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
                        </div>
                    </CardContent>
                </Card>

            </div>
        </main>
    );
}

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallPWAButton } from "@/components/layout/install-pwa-button";
import { ShoppingCart, Archive, Users, FileText, BarChart3, Bell, Rocket, Star, Quote, ShieldCheck, Zap, DatabaseZap } from 'lucide-react';
import Link from "next/link";
import { LandingHeader } from "./landing-header";

const features = [
    { icon: ShoppingCart, title: "Gestion des Ventes", description: "Interface de caisse rapide, support multi-paniers et suivi des paiements." },
    { icon: Archive, title: "Gestion d'Inventaire", description: "Suivi en temps réel des stocks, alertes de stock faible et gestion des prix." },
    { icon: Users, title: "Suivi des Clients", description: "Base de données clients, historique des achats et gestion des dettes." },
    { icon: FileText, title: "Réception de Stock", description: "Enregistrement facile des livraisons fournisseurs et mise à jour de l'inventaire." },
    { icon: BarChart3, title: "Tableau de Bord Analytique", description: "Indicateurs de performance clés pour des décisions éclairées." },
    { icon: Bell, title: "Centre de Notifications", description: "Alertes proactives pour les stocks bas et les retards de paiement." },
];

const testimonials = [
    {
        quote: "iPOS a complètement changé la donne pour ma boutique. Le fait que tout soit hors ligne me donne une tranquillité d'esprit incroyable. C'est rapide, fiable, et mes données restent privées.",
        name: "Amina K.",
        role: "Gérante de supérette",
    },
    {
        quote: "Enfin un système de caisse qui ne dépend pas d'Internet ! La gestion des dettes clients est simple et efficace. Je peux enfin travailler sans interruption, même lorsque la connexion est mauvaise.",
        name: "Karim B.",
        role: "Propriétaire d'une boulangerie",
    },
    {
        quote: "J'adore la simplicité et la puissance d'iPOS. L'interface est épurée, et la fonction de sauvegarde et de restauration manuelle me donne un contrôle total sur mes informations. Un outil indispensable.",
        name: "Yasmine L.",
        role: "Gérante de café",
    }
];

const faqs = [
    {
        question: "Où sont stockées mes données ?",
        answer: "Toutes vos données (produits, ventes, clients) sont stockées exclusivement sur votre appareil, dans la base de données de votre navigateur (IndexedDB). Personne d'autre que vous n'y a accès."
    },
    {
        question: "Que se passe-t-il si je nettoie mon navigateur ou si mon ordinateur tombe en panne ?",
        answer: "C'est un point crucial. Étant donné que les données sont locales, elles seront perdues si vous effacez les données de votre navigateur ou si votre appareil est endommagé. Il est impératif d'utiliser la fonction de sauvegarde régulièrement pour créer un fichier de vos données que vous pouvez conserver en lieu sûr."
    },
    {
        question: "Puis-je utiliser l'application sur plusieurs appareils ?",
        answer: "Non. Comme les données sont stockées localement, elles ne sont pas synchronisées entre différents appareils. L'application est conçue pour fonctionner sur un poste de travail principal."
    },
    {
        question: "Dois-je payer pour utiliser iPOS ?",
        answer: "Non, iPOS est entièrement gratuit. C'est un projet développé pour aider les petits commerçants avec un outil puissant et accessible, sans frais cachés ni abonnements."
    }
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
        <>
            <LandingHeader />
            {/* Hero Section */}
            <section className="w-full py-20 md:py-32 bg-muted/20">
                <div className="container px-4 md:px-6 grid lg:grid-cols-2 gap-10 items-center">
                    <div className="flex flex-col items-start space-y-6 text-left">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                           Votre Commerce, Vos Données, Votre Contrôle.
                        </h1>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl">
                            iPOS est la solution de point de vente 100% hors ligne qui place vos données sous votre contrôle direct. Gérez vos ventes, stocks et clients en toute confidentialité, sans jamais dépendre d'une connexion internet.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg">
                                <Link href="/sell">Lancer l'application</Link>
                            </Button>
                             <Button asChild size="lg" variant="outline">
                                <Link href="#features">Découvrir les fonctionnalités</Link>
                            </Button>
                        </div>
                         <div className="pt-4">
                            <InstallPWAButton />
                        </div>
                    </div>
                     <div className="hidden lg:flex items-center justify-center">
                        <div className="relative w-full max-w-2xl">
                           <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/10 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
                           <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary/20 rounded-full filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
                           <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 rounded-full filter blur-3xl opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
                           <Card className="transform transition-transform duration-500 hover:scale-105 shadow-2xl relative z-10 bg-card/60 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Tableau de bord</span>
                                        <BarChart3 className="h-5 w-5 text-muted-foreground"/>
                                    </CardTitle>
                                </CardHeader>
                               <CardContent className="space-y-4">
                                   <div className="flex justify-between p-4 rounded-lg bg-green-500/10">
                                       <span className="font-semibold">Chiffre d'affaires</span>
                                       <span className="font-bold text-green-600">1,250.75 DA</span>
                                   </div>
                                    <div className="flex justify-between p-4 rounded-lg bg-yellow-500/10">
                                       <span className="font-semibold">Produits à faible stock</span>
                                       <span className="font-bold text-yellow-600">3</span>
                                   </div>
                                   <div className="flex justify-between p-4 rounded-lg bg-red-500/10">
                                       <span className="font-semibold">Total des dettes</span>
                                       <span className="font-bold text-red-600">8,430.00 DA</span>
                                   </div>
                               </CardContent>
                           </Card>
                        </div>
                    </div>
                </div>
            </section>

             {/* Why iPOS Section */}
            <section className="w-full py-20 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center space-y-2">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Zap className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Ultra Rapide</h3>
                            <p className="text-muted-foreground">Chaque action est instantanée car tout se passe sur votre appareil, sans latence réseau.</p>
                        </div>
                         <div className="flex flex-col items-center space-y-2">
                             <div className="p-3 bg-primary/10 rounded-full">
                                <DatabaseZap className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">100% Hors Ligne</h3>
                            <p className="text-muted-foreground">Pas d'internet ? Pas de problème. L'application est conçue pour fonctionner sans interruption.</p>
                        </div>
                         <div className="flex flex-col items-center space-y-2">
                             <div className="p-3 bg-primary/10 rounded-full">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Confidentialité Totale</h3>
                            <p className="text-muted-foreground">Vos données ne quittent jamais votre appareil. Vous êtes la seule personne à y avoir accès.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="w-full py-20 md:py-24 bg-muted/20">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Fonctionnalités Complètes
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            Tout ce dont vous avez besoin pour une gestion commerciale efficace, et plus encore.
                        </p>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-4 text-left">
                                <div className="bg-background p-3 rounded-full flex-shrink-0 border shadow-sm">
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
            
            {/* Tech Section */}
            <section className="w-full py-20 md:py-24">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Conçu avec des technologies de pointe
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                            iPOS s'appuie sur une pile technologique moderne pour garantir performance, et une expérience utilisateur exceptionnelle.
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-around items-center p-8 bg-muted/50 rounded-lg">
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
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="w-full py-20 md:py-24 bg-muted/20">
                <div className="container px-4 md:px-6">
                    <div className="flex flex-col items-center text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Ce que disent nos utilisateurs
                        </h2>
                        <p className="max-w-[700px] text-muted-foreground md:text-lg">
                           La confiance de nos commerçants est notre plus grande fierté.
                        </p>
                    </div>
                    <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-3">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="flex flex-col justify-between">
                                <CardContent className="pt-6">
                                    <Quote className="h-8 w-8 text-primary/30 mb-4" />
                                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                                </CardContent>
                                 <div className="p-6 border-t mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                                        </div>
                                    </div>
                                    <h4 className="font-bold mt-2">{testimonial.name}</h4>
                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

             {/* FAQ Section */}
            <section id="faq" className="w-full py-20 md:py-24">
                <div className="container px-4 md:px-6">
                     <div className="flex flex-col items-center text-center space-y-4 mb-12">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                            Questions Fréquentes
                        </h2>
                    </div>
                     <div className="max-w-3xl mx-auto space-y-4">
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


            {/* Footer */}
            <footer className="w-full py-6 border-t">
                <div className="container flex flex-col sm:flex-row items-center justify-between text-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} iPOS. Développé par zenagui bilal.
                    </p>
                     <div className="flex gap-4 text-sm text-muted-foreground">
                        <Link href="/privacy" className="hover:text-primary">Confidentialité</Link>
                         <Link href="/terms" className="hover:text-primary">Conditions</Link>
                        <Link href="/about" className="hover:text-primary">Contact</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}

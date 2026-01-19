'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstallPWAButton } from "@/components/layout/install-pwa-button";
import { ShoppingCart, Archive, Users, FileText, BarChart3, Bell, Rocket, Star, Quote, ShieldCheck, Zap, CloudOff } from 'lucide-react';
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
        quote: "iPOS a transformé la gestion de ma boutique. L'interface est intuitive et la gestion des stocks me fait gagner un temps précieux chaque jour. Le mode hors ligne est un sauveur !",
        name: "Amina K.",
        role: "Gérante de supérette",
    },
    {
        quote: "La meilleure fonctionnalité pour moi est la gestion des dettes clients. C'est simple, clair et les rappels sont très efficaces. Je recommande vivement cette application.",
        name: "Karim B.",
        role: "Propriétaire d'une boulangerie",
    },
    {
        quote: "En tant que développeur, j'apprécie la modernité de la pile technique. Mais en tant qu'utilisateur, j'aime juste le fait que 'ça marche', tout simplement. C'est rapide, fiable et beau.",
        name: "Yasmine L.",
        role: "Gérante de café",
    }
];

const faqs = [
    {
        question: "L'application fonctionne-t-elle sans connexion internet ?",
        answer: "Oui ! iPOS est conçu comme une Progressive Web App (PWA). Une fois installée, vous pouvez effectuer la plupart des opérations (ventes, gestion du panier) sans connexion. Les données se synchroniseront automatiquement dès que vous serez de nouveau en ligne."
    },
    {
        question: "Mes données sont-elles en sécurité ?",
        answer: "Absolument. Vos données sont stockées sur Firebase de Google, une plateforme robuste et sécurisée. De plus, chaque utilisateur a son propre espace de données isolé, personne d'autre ne peut y accéder."
    },
    {
        question: "L'application est-elle vraiment gratuite ?",
        answer: "Oui, l'utilisation de iPOS est gratuite. Le projet est maintenu par un développeur passionné dans le but d'offrir un outil de qualité aux petits commerçants."
    },
    {
        question: "Puis-je l'utiliser sur mon téléphone ou ma tablette ?",
        answer: "Oui, l'interface est entièrement responsive et conçue pour fonctionner parfaitement sur les ordinateurs de bureau, les tablettes et les smartphones."
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
                           Votre commerce, simplifié et modernisé.
                        </h1>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl">
                            iPOS est la solution de point de vente qui allie puissance et simplicité. Gérez vos ventes, stocks et clients avec une rapidité fulgurante, même hors ligne.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg">
                                <Link href="/signup">Démarrer gratuitement</Link>
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
                           <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
                           <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/20 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                           <Card className="transform transition-transform duration-500 hover:scale-105 shadow-2xl">
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
                            <p className="text-muted-foreground">Conçu pour la vitesse. Chaque clic, chaque action est optimisée pour ne pas vous ralentir.</p>
                        </div>
                         <div className="flex flex-col items-center space-y-2">
                             <div className="p-3 bg-primary/10 rounded-full">
                                <CloudOff className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Fonctionne Hors Ligne</h3>
                            <p className="text-muted-foreground">Pas d'internet ? Pas de problème. Continuez à vendre et synchronisez plus tard.</p>
                        </div>
                         <div className="flex flex-col items-center space-y-2">
                             <div className="p-3 bg-primary/10 rounded-full">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold">Sécurisé</h3>
                            <p className="text-muted-foreground">Vos données sont protégées et isolées grâce à la puissance de Firebase.</p>
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
                            iPOS s'appuie sur une pile technologique moderne pour garantir performance, sécurité et une expérience utilisateur exceptionnelle.
                        </p>
                    </div>
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-around items-center p-8 bg-muted/50 rounded-lg">
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
                        <Link href="#features" className="hover:text-primary">Fonctionnalités</Link>
                        <Link href="/about" className="hover:text-primary">Contact</Link>
                    </div>
                </div>
            </footer>
        </>
    );
}

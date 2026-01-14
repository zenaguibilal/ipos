
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Code, User, Github, Linkedin, Mail } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
            <div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">

                {/* About the App Card */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Info className="h-6 w-6" />
                            À propos d'iPOS
                        </CardTitle>
                        <CardDescription>
                            Votre solution de point de vente simple et efficace.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4 text-sm">
                        <p>
                            <strong>iPOS</strong> est un système de point de vente (POS) moderne conçu pour la gestion agile des petits commerces. Développé avec Next.js et Firebase, il offre une expérience rapide, réactive et fonctionnelle même hors ligne.
                        </p>
                        <p>
                            L'application centralise les opérations critiques de vente, de gestion des stocks, et de suivi client en une seule interface intuitive.
                        </p>
                         <h4 className="font-semibold pt-2">Technologies utilisées :</h4>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Next.js (React Framework)</li>
                            <li>Firebase (Base de données & Authentification)</li>
                            <li>Tailwind CSS & ShadCN UI</li>
                            <li>Progressive Web App (PWA)</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* About the Developer Card */}
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
                    <CardContent className="flex-grow space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                                <Code className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Zenagui Bilal</h3>
                                <p className="text-muted-foreground">Développeur Full-Stack</p>
                            </div>
                        </div>
                        <p className="text-sm">
                            Développeur passionné avec une expertise dans la création d'applications web modernes, performantes et centrées sur l'utilisateur.
                        </p>
                        <div className="space-y-2 pt-2">
                             <Button asChild variant="outline" className="w-full justify-start gap-2">
                                <Link href="https://github.com/zenagui-bilal" target="_blank">
                                    <Github className="h-4 w-4" />
                                    <span>zenagui-bilal</span>
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full justify-start gap-2">
                                <Link href="https://www.linkedin.com/in/bilal-zenagui/" target="_blank">
                                    <Linkedin className="h-4 w-4" />
                                    <span>bilal-zenagui</span>
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="w-full justify-start gap-2">
                                <Link href="mailto:zenaguibilal.pro@gmail.com">
                                    <Mail className="h-4 w-4" />
                                    <span>zenaguibilal.pro@gmail.com</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </main>
    );
}

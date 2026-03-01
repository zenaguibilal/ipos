'use client';

import Link from 'next/link';
import { AnimatedLogo } from './animated-logo';

export function LandingFooter() {
    return (
        <footer className="border-t bg-muted/50">
            <div className="container py-12">
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                         <Link href="/" className="flex items-center gap-2 font-semibold">
                            <span className="text-2xl">🏪</span>
                            <AnimatedLogo />
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            La solution de point de vente simple, rapide et 100% hors ligne pour les commerçants modernes.
                        </p>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-semibold mb-3">Produit</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/#fonctionnalites" className="text-muted-foreground hover:text-primary">Fonctionnalités</Link></li>
                                <li><Link href="/#philosophie" className="text-muted-foreground hover:text-primary">Philosophie</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-3">Support</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/#faq" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-3">Légal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/terms" className="text-muted-foreground hover:text-primary">Conditions d'utilisation</Link></li>
                                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary">Politique de confidentialité</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-3">Application</h4>
                             <ul className="space-y-2 text-sm">
                                <li><Link href="/sell" className="text-muted-foreground hover:text-primary">Lancer l'application</Link></li>
                                <li><Link href="/about" className="text-muted-foreground hover:text-primary">À propos</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                 <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} iPOS. Développé par zenagui bilal.</p>
                </div>
            </div>
        </footer>
    );
}

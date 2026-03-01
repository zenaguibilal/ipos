'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedLogo } from './animated-logo';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '#fonctionnalites', label: 'Fonctionnalités' },
    { href: '#philosophie', label: 'Philosophie' },
    { href: '#temoignages', label: 'Témoignages' },
    { href: '#faq', label: 'FAQ' },
];

export function LandingHeader() {
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setHasScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    
    const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.querySelector(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };


    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            hasScrolled ? "bg-background/80 backdrop-blur-sm border-b" : "bg-transparent"
        )}>
            <div className="container flex items-center justify-between h-20">
                 <Link href="/" className="flex items-center gap-2 font-semibold">
                     <span className="text-2xl">🏪</span>
                     <AnimatedLogo />
                 </Link>

                <nav className="hidden lg:flex items-center gap-6">
                    {navLinks.map(link => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            onClick={(e) => handleScrollTo(e, link.href)}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <Button asChild variant={hasScrolled ? 'default' : 'secondary'}>
                        <Link href="/sell">Lancer l'application</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

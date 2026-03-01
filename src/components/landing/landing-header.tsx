'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { AnimatedLogo } from '../layout/animated-logo';

export function LandingHeader() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full transition-all duration-300",
            isScrolled ? "border-b bg-background/80 backdrop-blur-sm" : "bg-transparent"
        )}>
            <div className="container flex h-16 items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <span className="text-2xl">🏪</span>
                        <AnimatedLogo />
                    </Link>
                </div>

                {/* Center Nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
                        Fonctionnalités
                    </Link>
                    <Link href="#testimonials" className="text-muted-foreground transition-colors hover:text-foreground">
                        Témoignages
                    </Link>
                    <Link href="#faq" className="text-muted-foreground transition-colors hover:text-foreground">
                        FAQ
                    </Link>
                </nav>

                {/* Right Side */}
                <div className="flex items-center">
                    <Button asChild>
                        <Link href="/sell">Lancer l'application</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

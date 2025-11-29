
'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store, ShoppingCart, Package, Users, LineChart, Cookie, Bell, Building, Warehouse, ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

const navLinks = [
  { href: '/sell', icon: ShoppingCart, label: 'Vendre' },
  { href: '/products', icon: Package, label: 'Produits' },
  { href: '/stock-intake', icon: Warehouse, label: 'Réception Stock' },
  { href: '/purchase-orders', icon: ClipboardList, label: 'Bons de Commande' },
  { href: '/customers', icon: Users, label: 'Clients' },
  { href: '/bread-orders', icon: Cookie, label: 'Commandes de Pain' },
  { href: '/sales-history', icon: LineChart, label: 'Historique' },
  { href: '/notifications', icon: Bell, label: 'Alertes' },
  { href: '/profile', icon: Building, label: 'Profil' },
];


function AuthContent() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="mt-8 h-11 w-64 rounded-md animate-pulse bg-muted" />;
  }

  if (user) {
    return (
        <div className="w-full max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">Accès Rapide</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {navLinks.map((link) => (
                    <Link href={link.href} key={link.href} passHref>
                        <Card className="h-full transform transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:scale-105 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <CardHeader className="flex flex-col items-center justify-center text-center p-4 h-full">
                                <link.icon className="h-10 w-10 mb-3 text-primary" />
                                <CardTitle className="text-base md:text-lg font-semibold">{link.label}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
            <div className="mt-8 text-center">
                 <Button asChild variant="secondary">
                    <Link href="/dashboard">Voir le tableau de bord complet</Link>
                </Button>
            </div>
        </div>
    );
  }

  return (
    <>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Store className="h-16 w-16 text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">iPOS</h1>
        </div>
        <p className="mt-2 text-lg md:text-xl text-muted-foreground max-w-md">
          La solution de point de vente simple et efficace pour gérer votre commerce.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Créer un compte</Link>
          </Button>
          <Button variant="secondary" asChild size="lg">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
    </>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-6 bg-background">
      <main className="flex flex-col items-center flex-1 justify-center">
        <AuthContent />
      </main>
      <footer className="w-full text-center text-muted-foreground text-sm py-4">
          <p className="mb-2 max-w-2xl mx-auto">iPOS est une solution de point de vente moderne conçue pour vous aider à gérer votre inventaire, vos ventes et vos clients avec simplicité et efficacité.</p>
          <p>Développé par zenagui bilal</p>
      </footer>
    </div>
  );
}

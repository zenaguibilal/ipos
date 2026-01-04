
'use client';

import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, Store, ShoppingCart, Package, Users, LineChart, Cookie, Bell, Building, Warehouse, FileText, BarChart2, DollarSign, Box, HandCoins, Settings, TrendingUp, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { InstallPWAButton } from '@/components/layout/install-pwa-button';

const navLinks = [
  { href: '/customers', icon: Users , label: 'العملاء', color: 'bg-cyan-500' },
  { href: '/products', icon: ShoppingCart, label: 'الاصناف', color: 'bg-purple-600' },
  { href: '/stock-intake', icon: Users , label: 'المورديين', color: 'bg-red-500' },
  { href: '/sales-history', icon: FileText , label: 'الحسابات الاخري', color: 'bg-teal-500' },
  { href: '/dashboard', icon: DollarSign, label: 'حركه الخزينه', color: 'bg-green-500' },
  { href: '/products', icon: Box, label: 'حركه صنف', color: 'bg-rose-500' },
  { href: '/stock-intake', icon: HandCoins, label: 'كشف حساب مورد', color: 'bg-blue-600' },
  { href: '/customers', icon: Receipt, label: 'كشف حساب عميل', color: 'bg-orange-500' },
  { href: '/sell', icon: Settings, label: 'شاشه الادخال اليومي', color: 'bg-blue-700' },
  { href: '/dashboard', icon: HandCoins, label: 'ملخص حركه الخزينه', color: 'bg-orange-600' },
  { href: '/dashboard', icon: TrendingUp, label: 'تحليل المشتريات', color: 'bg-emerald-500' },
  { href: '/dashboard', icon: BarChart2, label: 'تحليل المبيعات', color: 'bg-rose-500' },
];


function AuthContent() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return <div className="mt-8 h-64 w-full max-w-4xl rounded-md animate-pulse bg-muted" />;
  }

  if (user) {
    return (
        <div className="w-full max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {navLinks.map((link) => (
                    <Link href={link.href} key={link.href} passHref>
                        <Card className={`text-white transition-transform duration-200 hover:scale-105 hover:shadow-xl focus:scale-105 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${link.color}`}>
                            <CardHeader className="flex flex-col items-center justify-center text-center p-4 h-32">
                                <link.icon className="h-10 w-10 mb-3" />
                                <CardTitle className="text-lg md:text-xl font-bold">{link.label}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
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
           <InstallPWAButton />
        </div>
    </>
  );
}


export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4 md:p-6 bg-background">
      <main className="flex flex-col items-center flex-1 justify-center w-full">
        <AuthContent />
      </main>
      <footer className="w-full text-center text-muted-foreground text-sm py-4 mt-8">
          <p>Développé par zenagui bilal</p>
      </footer>
    </div>
  );
}

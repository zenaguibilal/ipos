
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Store,
  Cookie,
  Bell,
  Building,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/sell', icon: ShoppingCart, label: 'Vendre' },
  { href: '/products', icon: Package, label: 'Produits' },
  { href: '/stock-intake', icon: Warehouse, label: 'Réception Stock' },
  { href: '/customers', icon: Users, label: 'Clients' },
  { href: '/bread-orders', icon: Cookie, label: 'Commandes de Pain' },
  { href: '/sales-history', icon: LineChart, label: 'Historique' },
  { href: '/notifications', icon: Bell, label: 'Alertes' },
  { href: '/profile', icon: Building, label: 'Profil' },
];


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
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
    </div>
  );
}

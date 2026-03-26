'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users2,
  LayoutDashboard,
  ShoppingCart,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

const allNavLinks = [
  { href: '/products', label: 'Produits', icon: Package, manager: true },
  { href: '/customers', label: 'Clients', icon: Users2, manager: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, manager: false },
  { href: '/stock', label: 'Stock', icon: Archive, manager: true },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const isManagerOrAdmin = useIsManagerOrAdmin();

  const navLinks = allNavLinks.filter(link => !link.manager || isManagerOrAdmin);

  return (
    <div className="fixed bottom-0 left-0 z-30 w-full border-t bg-background/80 backdrop-blur-xl md:hidden print-hide">
      <div className="grid grid-cols-5 items-stretch justify-around h-16">
        {navLinks.slice(0, 2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary h-full',
              (pathname.startsWith(link.href)) ? 'text-primary' : ''
            )}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-[10px] text-center">{link.label}</span>
          </Link>
        ))}

        <div className="flex items-center justify-center">
            <Link href="/sell" className="-mt-8">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
                    <ShoppingCart className="h-7 w-7" />
                 </div>
            </Link>
        </div>

        {navLinks.slice(2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary h-full',
              (pathname.startsWith(link.href)) ? 'text-primary' : ''
            )}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-[10px] text-center">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users2,
  LayoutDashboard,
  ShoppingCart,
  Archive,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

const allNavLinks = [
  { href: '/dashboard', label: 'Stats', icon: LayoutDashboard, manager: false },
  { href: '/customers', label: 'Clients', icon: Users2, manager: false },
  { href: '/sales-history', label: 'Ventes', icon: History, manager: false },
  { href: '/stock', label: 'Stock', icon: Archive, manager: true },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const isManagerOrAdmin = useIsManagerOrAdmin();

  const navLinks = allNavLinks.filter(link => !link.manager || isManagerOrAdmin);

  return (
    <div className="fixed bottom-0 left-0 z-30 w-full border-t bg-background/80 backdrop-blur-xl md:hidden print-hide safe-bottom">
      <div className="grid grid-cols-5 items-stretch justify-around h-16">
        {navLinks.slice(0, 2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full relative group',
              (pathname.startsWith(link.href)) ? 'text-primary' : 'text-muted-foreground opacity-70'
            )}
          >
            <link.icon className={cn("h-5 w-5 transition-transform", pathname.startsWith(link.href) && "scale-110")} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-center">{link.label}</span>
            {pathname.startsWith(link.href) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            )}
          </Link>
        ))}

        <div className="flex items-center justify-center">
            <Link href="/sell" className="-mt-10 transition-transform active:scale-95">
                 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_25px_-5px_rgba(var(--primary),0.4)] ring-4 ring-background relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <ShoppingCart className="h-7 w-7 relative z-10" />
                 </div>
            </Link>
        </div>

        {navLinks.slice(2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 transition-all duration-300 h-full relative group',
              (pathname.startsWith(link.href)) ? 'text-primary' : 'text-muted-foreground opacity-70'
            )}
          >
            <link.icon className={cn("h-5 w-5 transition-transform", pathname.startsWith(link.href) && "scale-110")} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-center">{link.label}</span>
            {pathname.startsWith(link.href) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users2,
  LayoutDashboard,
  ShoppingCart,
  Archive,
  History,
  Search,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

/**
 * @fileOverview Sovereign Mobile Navigation (Luxury Edition)
 * Optimized for thumb reach and visual dominance.
 */

const allNavLinks = [
  { href: '/dashboard', label: 'Stats', icon: LayoutDashboard, manager: false },
  { href: '/customers', label: 'Clients', icon: Users2, manager: false },
  { href: '/sales-history', label: 'Ventes', icon: History, manager: false },
  { href: '/stock', label: 'Stock', icon: Archive, manager: true },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const isManagerOrAdmin = useIsManagerOrAdmin();

  // Filter links based on role authority
  const navLinks = allNavLinks.filter(link => !link.manager || isManagerOrAdmin);

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/5 bg-background/80 backdrop-blur-3xl md:hidden print-hide safe-bottom pb-4 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.3)]">
      <div className="grid grid-cols-5 items-stretch justify-around h-16 px-2">
        
        {/* Left Section Links */}
        {navLinks.slice(0, 2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 transition-all duration-500 h-full relative group',
              (pathname.startsWith(link.href)) ? 'text-primary scale-105' : 'text-muted-foreground opacity-50'
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all",
                pathname.startsWith(link.href) && "bg-primary/10 shadow-inner"
            )}>
                <link.icon className={cn("h-5 w-5 transition-transform", pathname.startsWith(link.href) && "scale-110")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">
                {link.label}
            </span>
            {pathname.startsWith(link.href) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
            )}
          </Link>
        ))}

        {/* The Sovereign Action - Live Sell */}
        <div className="flex items-center justify-center">
            <Link href="/sell" className="-mt-12 transition-all active:scale-90 relative group">
                 {/* Visual glow */}
                 <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl group-hover:bg-primary/60 transition-all duration-700 animate-pulse" />
                 
                 <div className="flex h-16 w-16 items-center justify-center rounded-[2rem] bg-primary text-primary-foreground shadow-[0_15px_30px_-5px_rgba(var(--primary),0.5)] ring-4 ring-background relative overflow-hidden z-10 border border-white/20">
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <ShoppingCart className="h-7 w-7 relative z-10 group-hover:scale-110 transition-transform" />
                 </div>
                 
                 <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Vente Live
                 </span>
            </Link>
        </div>

        {/* Right Section Links */}
        {navLinks.slice(2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 transition-all duration-500 h-full relative group',
              (pathname.startsWith(link.href)) ? 'text-primary scale-105' : 'text-muted-foreground opacity-50'
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all",
                pathname.startsWith(link.href) && "bg-primary/10 shadow-inner"
            )}>
                <link.icon className={cn("h-5 w-5 transition-transform", pathname.startsWith(link.href) && "scale-110")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">
                {link.label}
            </span>
            {pathname.startsWith(link.href) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
            )}
          </Link>
        ))}

        {/* More/Profile Quick Access */}
        <Link
            href="/profile"
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 transition-all duration-500 h-full relative group',
              (pathname.startsWith('/profile')) ? 'text-primary' : 'text-muted-foreground opacity-50'
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all",
                pathname.startsWith('/profile') && "bg-primary/10 shadow-inner"
            )}>
                <Menu className={cn("h-5 w-5 transition-transform", pathname.startsWith('/profile') && "scale-110")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-center px-1">Menu</span>
            {pathname.startsWith('/profile') && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
            )}
          </Link>
      </div>
    </div>
  );
}

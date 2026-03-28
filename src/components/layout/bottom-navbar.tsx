'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users2,
  LayoutDashboard,
  ShoppingCart,
  Archive,
  History,
  Settings2,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';

/**
 * @fileOverview Sovereign Mobile Navigation (Luxury Floating Edition)
 * Updated to respect granular staff permissions.
 */

const allNavLinks = [
  { slug: 'dashboard', href: '/dashboard', label: 'Stats', icon: LayoutDashboard, manager: false },
  { slug: 'customers', href: '/customers', label: 'Clients', icon: Users2, manager: false },
  { slug: 'sales-history', href: '/sales-history', label: 'Historique', icon: History, manager: false },
  { slug: 'settings', href: '/settings', label: 'Réglages', icon: Settings2, manager: true },
];

export function BottomNavBar() {
  const pathname = usePathname();
  const isManagerOrAdmin = useIsManagerOrAdmin();
  const { profile } = useAppStore();

  // Role & Permission Filtering for mobile links
  const navLinks = allNavLinks.filter(link => {
    const roleAllowed = !link.manager || isManagerOrAdmin;
    const permissionAllowed = profile?.permissions?.length ? profile.permissions.includes(link.slug) : true;
    return roleAllowed && permissionAllowed;
  });

  const isSellAllowed = profile?.permissions?.length ? profile.permissions.includes('sell') : true;

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/5 bg-background/80 backdrop-blur-3xl md:hidden print-hide safe-bottom pb-4 shadow-[0_-15px_40px_-5px_rgba(0,0,0,0.4)]">
      <div className={cn(
          "grid items-stretch justify-around h-16 px-2",
          isSellAllowed ? "grid-cols-5" : `grid-cols-${navLinks.length + 1}`
      )}>
        
        {/* First half of links */}
        {navLinks.slice(0, 2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 transition-all duration-500 h-full relative group',
              (pathname === link.href || pathname.startsWith(link.href + '/')) ? 'text-primary' : 'text-muted-foreground opacity-50'
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all duration-500",
                (pathname === link.href || pathname.startsWith(link.href + '/')) && "bg-primary/10 shadow-inner"
            )}>
                <link.icon className={cn("h-5 w-5 transition-transform", (pathname === link.href || pathname.startsWith(link.href + '/')) && "scale-110")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-center px-1">
                {link.label}
            </span>
            {(pathname === link.href || pathname.startsWith(link.href + '/')) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
            )}
          </Link>
        ))}

        {/* Central Action: Live Sell (If Allowed) */}
        {isSellAllowed && (
            <div className="flex items-center justify-center">
                <Link href="/sell" className="-mt-12 transition-all active:scale-90 relative group">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-all duration-1000 animate-pulse" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-[2.2rem] bg-primary text-primary-foreground shadow-[0_15px_35px_-5px_rgba(var(--primary),0.6)] ring-4 ring-background relative overflow-hidden z-10 border border-white/20">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50" />
                        <ShoppingCart className="h-7 w-7 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </Link>
            </div>
        )}

        {/* Second half of links */}
        {navLinks.slice(2).map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 transition-all duration-500 h-full relative group',
              (pathname === link.href || pathname.startsWith(link.href + '/')) ? 'text-primary' : 'text-muted-foreground opacity-50'
            )}
          >
            <div className={cn(
                "p-2 rounded-2xl transition-all duration-500",
                (pathname === link.href || pathname.startsWith(link.href + '/')) && "bg-primary/10 shadow-inner"
            )}>
                <link.icon className={cn("h-5 w-5 transition-transform", (pathname === link.href || pathname.startsWith(link.href + '/')) && "scale-110")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-center px-1">
                {link.label}
            </span>
            {(pathname === link.href || pathname.startsWith(link.href + '/')) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
            )}
          </Link>
        ))}

        {/* Profile Link (Always Visible) */}
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
                <Activity className={cn("h-5 w-5 transition-transform", pathname.startsWith('/profile') && "scale-110")} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-center px-1">Profil</span>
            {pathname.startsWith('/profile') && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
            )}
          </Link>
      </div>
    </div>
  );
}

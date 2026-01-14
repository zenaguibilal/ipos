
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBasket,
  Package,
  Users,
  History,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navLinks = [
  { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/sell', label: 'Vendre', icon: ShoppingBasket },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/customers', label: 'Clients', icon: Users },
  { href: '/sales-history', label: 'Historique', icon: History },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm md:hidden print-hide">
      <nav className="grid grid-cols-5 items-center justify-around h-16">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary h-full',
              pathname.startsWith(link.href) && 'text-primary'
            )}
          >
            <link.icon className="h-5 w-5" />
            <span className="text-[10px] text-center">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

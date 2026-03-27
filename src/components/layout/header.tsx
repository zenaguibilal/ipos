'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Package,
  Users2,
  ShoppingCart,
  History,
  Undo2,
  Archive,
  Wallet,
  LayoutDashboard,
  Wheat,
  Building,
  Coins,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Clock } from '@/components/layout/clock';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsManagerOrAdmin } from '@/stores/appStore';

const allNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, managerOnly: false },
  { href: '/stock', label: 'Stock', icon: Archive, managerOnly: true },
  { href: '/products', label: 'Produits', icon: Package, managerOnly: true },
  { href: '/suppliers', label: 'Fournisseurs', icon: Building, managerOnly: true },
  { href: '/customers', label: 'Clients', icon: Users2, managerOnly: false },
  { href: '/sales-history', label: 'Ventes', icon: History, managerOnly: false },
  { href: '/returns', label: 'Retours', icon: Undo2, managerOnly: false },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, managerOnly: true },
  { href: '/bread', label: 'Pain', icon: Wheat, managerOnly: true },
  { href: '/zakat', label: 'Zakat', icon: Coins, managerOnly: true },
];

export function AppHeader() {
  const pathname = usePathname();
  const isManagerOrAdmin = useIsManagerOrAdmin();

  const mainActionLinks = [
    { href: '/sell', label: 'Point de Vente', icon: ShoppingCart },
  ];
  
  const navLinks = allNavLinks.filter(link => !link.managerOnly || isManagerOrAdmin);

  return (
    <header className="flex h-16 items-center gap-4 bg-background/80 px-4 sm:px-6 print-hide sticky top-0 z-30 border-b backdrop-blur-xl transition-colors duration-500">
      <div className="flex-1 flex justify-start">
         <div className="flex items-baseline gap-2">
              <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
              >
                  <Image src="/icon.svg" alt="iPOS logo" width={32} height={32} priority />
                  <span className="hidden sm:inline-block text-xl font-semibold">iPOS</span>
              </Link>
          </div>
      </div>

        <div className="flex-1 flex justify-center">
            <TooltipProvider>
                <nav className="hidden xl:flex items-center gap-1 rounded-full border bg-black/5 dark:bg-black/20 p-1">
                    {mainActionLinks.map(link => (
                         <Tooltip key={link.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    asChild
                                    variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                    className="rounded-full relative h-10 px-6 text-base"
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-5 w-5 mr-2" />
                                        {link.label}
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{link.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    <div className="h-6 w-px bg-border/50 mx-2" />
                    {navLinks.map(link => (
                        <Tooltip key={link.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    asChild
                                    variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                    size="icon"
                                    className="rounded-full relative"
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-5 w-5" />
                                        <span className="sr-only">{link.label}</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{link.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </nav>
            </TooltipProvider>
        </div>


        <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-2 sm:gap-4">
                <Clock />
                <ThemeToggle />
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/profile">
                        <Settings className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </div>
    </header>
  );
}

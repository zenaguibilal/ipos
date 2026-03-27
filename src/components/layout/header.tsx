'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  ChevronDown,
  User,
  LogOut,
  Settings,
  ShieldCheck,
  Calculator
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsManagerOrAdmin, useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

const allNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, managerOnly: false },
  { href: '/stock', label: 'Réceptions', icon: Archive, managerOnly: true },
  { href: '/products', label: 'Articles', icon: Package, managerOnly: true },
  { href: '/costing', label: 'Coûts', icon: Calculator, managerOnly: true },
  { href: '/suppliers', label: 'Fournisseurs', icon: Building, managerOnly: true },
  { href: '/customers', label: 'Clients', icon: Users2, managerOnly: false },
  { href: '/sales-history', label: 'Historique', icon: History, managerOnly: false },
  { href: '/returns', label: 'Retours', icon: Undo2, managerOnly: false },
  { href: '/expenses', label: 'Dépenses', icon: Wallet, managerOnly: true },
  { href: '/bread', label: 'Boulangerie', icon: Wheat, managerOnly: true },
  { href: '/zakat', label: 'Zakat', icon: Coins, managerOnly: true },
];

export function AppHeader() {
  const pathname = usePathname();
  const isManagerOrAdmin = useIsManagerOrAdmin();
  const { profile, actions } = useAppStore();

  const mainActionLinks = [
    { href: '/sell', label: 'Vente', icon: ShoppingCart },
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
                  <span className="hidden sm:inline-block text-xl font-black tracking-tighter italic text-primary">iPOS</span>
              </Link>
          </div>
      </div>

        <div className="flex-grow flex justify-center">
            <TooltipProvider>
                <nav className="hidden xl:flex items-center gap-1 rounded-full border bg-black/5 dark:bg-black/20 p-1 luxury-glass border-white/5">
                    {mainActionLinks.map(link => (
                         <Tooltip key={link.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    asChild
                                    variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                    className={cn(
                                        "rounded-full relative h-9 px-5 text-sm font-bold transition-all",
                                        pathname.startsWith(link.href) && "shadow-lg shadow-primary/20"
                                    )}
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-4 w-4 mr-2" />
                                        {link.label}
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{link.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    <div className="h-5 w-px bg-border/50 mx-1" />
                    {navLinks.map(link => (
                        <Tooltip key={link.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    asChild
                                    variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "rounded-full relative h-9 w-9 transition-all",
                                        pathname.startsWith(link.href) && "text-primary bg-primary/10"
                                    )}
                                >
                                    <Link href={link.href}>
                                        <link.icon className="h-4 w-4" />
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
                <div className="hidden lg:block"><Clock /></div>
                <ThemeToggle />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="rounded-full pl-2 pr-1 h-10 gap-2 hover:bg-primary/10 transition-colors">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[10px] font-black text-primary-foreground shadow-inner">
                                {profile?.companyName?.substring(0, 1).toUpperCase() || 'U'}
                            </div>
                            <span className="hidden lg:inline-block text-xs font-bold truncate max-w-[100px]">
                                {profile?.companyName || 'Utilisateur'}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 luxury-glass">
                        <DropdownMenuLabel className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-primary">Terminal iPOS</span>
                            <span className="text-[10px] font-medium text-muted-foreground truncate">{profile?.email || 'Mode Souverain'}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                <User className="h-4 w-4" />
                                <span>Mon Profil</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/profile?tab=settings" className="flex items-center gap-2 cursor-pointer">
                                <Settings className="h-4 w-4" />
                                <span>Paramètres</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground opacity-50">
                            <ShieldCheck className="h-3 w-3" />
                            Accès: {profile?.role || 'Souverain'}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            onClick={() => actions.logout()}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-2 cursor-pointer"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Déconnexion</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </header>
  );
}

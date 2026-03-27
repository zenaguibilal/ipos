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
  Calculator,
  Terminal,
  Activity,
  Zap
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
import { useIsManagerOrAdmin, useAppStore, useAppRole } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  const role = useAppRole();
  const { profile, actions } = useAppStore();

  const mainActionLinks = [
    { href: '/sell', label: 'Caisse Live', icon: ShoppingCart },
  ];
  
  const navLinks = allNavLinks.filter(link => !link.managerOnly || isManagerOrAdmin);

  const roleConfig: Record<string, { label: string, color: string, icon: any, desc: string }> = {
    admin: { 
        label: 'ADMINISTRATEUR', 
        color: 'bg-primary text-primary-foreground shadow-lg shadow-primary/20', 
        icon: ShieldCheck,
        desc: 'Autorité Totale'
    },
    manager: { 
        label: 'GÉRANT', 
        color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20', 
        icon: User,
        desc: 'Gestion Opérationnelle'
    },
    cashier: { 
        label: 'CASHIER', 
        color: 'bg-orange-500 text-white shadow-lg shadow-orange-500/20', 
        icon: Activity,
        desc: 'Exécution Ventes'
    }
  };

  const currentRole = roleConfig[role] || roleConfig.cashier;

  return (
    <header className="flex h-16 items-center gap-4 bg-background/60 px-4 sm:px-8 print-hide sticky top-0 z-40 border-b border-white/5 backdrop-blur-2xl transition-all duration-500 shadow-sm">
      {/* Brand & Logo Section */}
      <div className="flex-1 flex justify-start">
         <div className="flex items-center gap-3">
              <Link
                  href="/dashboard"
                  className="flex items-center gap-3 hover:scale-105 transition-transform group"
              >
                  <div className="p-1.5 bg-background rounded-xl border border-primary/20 shadow-xl luxury-glass group-hover:border-primary/50 transition-colors">
                    <Image src="/icon.svg" alt="iPOS logo" width={28} height={32} priority />
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-none">
                    <span className="text-xl font-black tracking-tighter italic text-primary">iPOS</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Absolute Cloud</span>
                  </div>
              </Link>
          </div>
      </div>

        {/* Central Navigation Center (Tooltips Enabled) */}
        <div className="flex-grow flex justify-center">
            <TooltipProvider>
                <nav className="hidden xl:flex items-center gap-1 rounded-3xl border bg-black/5 dark:bg-black/20 p-1.5 luxury-glass border-white/5 shadow-inner">
                    {mainActionLinks.map(link => (
                         <Tooltip key={link.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button 
                                    asChild
                                    variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                    className={cn(
                                        "rounded-2xl relative h-10 px-6 text-xs font-black uppercase tracking-widest transition-all",
                                        pathname.startsWith(link.href) ? "shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-primary/10 hover:text-primary"
                                    )}
                                >
                                    <Link href={link.href}>
                                        <Zap className="h-4 w-4 mr-2.5 animate-pulse text-yellow-400" />
                                        {link.label}
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="luxury-glass">
                                <p className="text-[10px] font-bold uppercase tracking-widest">Interface de Vente Haute Rapidité (F9)</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    
                    <div className="h-6 w-px bg-white/10 mx-2" />
                    
                    <div className="flex items-center gap-1">
                        {navLinks.map(link => (
                            <Tooltip key={link.href} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button 
                                        asChild
                                        variant={pathname.startsWith(link.href) ? "secondary" : "ghost"}
                                        size="icon"
                                        className={cn(
                                            "rounded-2xl relative h-10 w-10 transition-all duration-300",
                                            pathname.startsWith(link.href) ? "text-primary bg-primary/10 shadow-inner" : "text-muted-foreground opacity-70 hover:opacity-100 hover:bg-white/5"
                                        )}
                                    >
                                        <Link href={link.href}>
                                            <link.icon className="h-4.5 w-4.5" />
                                            <span className="sr-only">{link.label}</span>
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="luxury-glass">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">{link.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </nav>
            </TooltipProvider>
        </div>


        {/* Command Center Controls (Right Section) */}
        <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-3 sm:gap-5">
                <div className="hidden lg:block border-r border-white/5 pr-5 py-1">
                    <Clock />
                </div>
                <ThemeToggle />
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="rounded-2xl pl-2 pr-1 h-12 gap-3 hover:bg-white/5 transition-all group border border-transparent hover:border-white/5">
                            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-black text-primary-foreground shadow-2xl shadow-primary/20 group-hover:scale-105 transition-transform">
                                {profile?.companyName?.substring(0, 1).toUpperCase() || 'S'}
                            </div>
                            <div className="hidden lg:flex flex-col items-start leading-none gap-1.5">
                                <span className="text-sm font-black uppercase tracking-tight truncate max-w-[120px]">
                                    {profile?.companyName || 'Mon Espace'}
                                </span>
                                <Badge className={cn("h-4 px-2 py-0 text-[7px] font-black uppercase tracking-tighter border-0", currentRole.color)}>
                                    <currentRole.icon className="h-2 w-2 mr-1" />
                                    {currentRole.label}
                                </Badge>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 luxury-glass p-2 mt-2 shadow-2xl border-white/10">
                        <DropdownMenuLabel className="flex flex-col p-4 bg-primary/5 rounded-xl mb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Terminal className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Terminal Souverain</span>
                            </div>
                            <span className="text-xs font-bold text-foreground truncate">{profile?.email || 'Instance Cloud iPOS'}</span>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="text-[8px] h-4 border-primary/30 text-primary uppercase font-black">{currentRole.desc}</Badge>
                            </div>
                        </DropdownMenuLabel>
                        
                        <div className="px-1 space-y-1">
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                    <User className="h-4 w-4 opacity-60" />
                                    <span className="text-xs font-bold">Centre de Commandement</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                                    <Settings className="h-4 w-4 opacity-60" />
                                    <span className="text-xs font-bold">Paramètres Système</span>
                                </Link>
                            </DropdownMenuItem>
                        </div>

                        <DropdownMenuSeparator className="bg-white/5 my-2" />
                        
                        <div className="px-4 py-2 flex items-center gap-3 text-[9px] font-black uppercase text-muted-foreground opacity-40">
                            <ShieldCheck className="h-3 w-3" />
                            Session: Sécurisée (AES-256)
                        </div>
                        
                        <DropdownMenuSeparator className="bg-white/5 my-2" />
                        
                        <DropdownMenuItem 
                            onClick={() => actions.logout()}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer mx-1"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Fin de session</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </header>
  );
}

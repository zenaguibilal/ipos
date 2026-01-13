
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  User as UserIcon,
  Store,
  LayoutDashboard,
  ShoppingBasket,
  Package,
  Users,
  History,
  Bell,
  Settings,
  Truck,
  Cookie,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, useUser } from '@/firebase';
import { Clock } from '@/components/layout/clock';
import { ThemeToggle } from './theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';


const navLinks = [
  { href: '/sell', label: 'Vendre', icon: ShoppingBasket },
  { href: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/stock-intake', label: 'Réception Stock', icon: Truck },
  { href: '/customers', label: 'Clients', icon: Users },
  { href: '/bread-orders', label: 'Commandes de Pain', icon: Cookie },
  { href: '/sales-history', label: 'Historique', icon: History },
  { href: '/notifications', label: 'Alertes', icon: Bell },
];

export function AppHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const getPageTitle = () => {
     if (pathname === '/profile') return 'Profil';
     if (pathname.startsWith('/customers/')) return 'Détails du Client';
     if (pathname.startsWith('/stock-intake/history')) return 'Historique des Réceptions';

     const activeLink = navLinks.find(link => pathname.startsWith(link.href));
     return activeLink?.label || 'iPOS';
  }


  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:px-6 print-hide sticky top-0 z-10">
       <div className="flex items-center gap-4">
            <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold"
            >
                <Store className="h-6 w-6" />
                <span className="sr-only">iPOS</span>
            </Link>
            <h1 className="text-xl font-semibold hidden sm:block">{getPageTitle()}</h1>
        </div>

        {/* Central Navigation */}
        <nav className="mx-auto hidden md:flex">
             <TooltipProvider>
                <ul className="flex items-center gap-2 rounded-full border bg-card p-1">
                    {navLinks.map(link => (
                         <li key={link.href}>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        asChild
                                        variant={pathname.startsWith(link.href) ? "default" : "ghost"} 
                                        size="icon"
                                        className="rounded-full"
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
                        </li>
                    ))}
                </ul>
            </TooltipProvider>
        </nav>


        <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Clock />
            <ThemeToggle />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">Menu utilisateur</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {user && (
                    <>
                         <DropdownMenuItem disabled>
                            <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.displayName || 'Utilisateur'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Profil & Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
      </div>
    </header>
  );
}

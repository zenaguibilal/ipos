'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Settings,
  BarChart3,
  Package,
  Users,
  ShoppingCart,
  History,
  Undo2,
  Archive,
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
import { Clock } from '@/components/layout/clock';
import { ThemeToggle } from './theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navLinks = [
  { href: '/dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/sell', label: 'Point de Vente', icon: ShoppingCart },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/customers', label: 'Clients', icon: Users },
  { href: '/bread', label: 'Pain', icon: Cookie },
  { href: '/sales-history', label: 'Ventes', icon: History },
  { href: '/returns', label: 'Retours', icon: Undo2 },
];

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();


  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:px-6 print-hide sticky top-0 z-20">
      <div className="flex-1 flex justify-start">
         <div className="flex items-baseline gap-2">
              <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
              >
                  <span className="text-2xl">🏪</span>
                  <span className="hidden sm:inline-block text-xl font-semibold">iPOS</span>
              </Link>
          </div>
      </div>

        <div className="flex-1 flex justify-center">
            <TooltipProvider>
                <nav className="hidden md:flex items-center gap-1 rounded-full border bg-card p-1">
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
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                    <UserIcon className="h-5 w-5" />
                    <span className="sr-only">Menu utilisateur</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                        <div className="flex flex-col">
                        <span className="text-sm font-medium">Utilisateur Local</span>
                        <span className="text-xs text-muted-foreground">Mode hors ligne</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profil & Paramètres</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </header>
  );
}

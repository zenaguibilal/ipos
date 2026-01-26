
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  User as UserIcon,
  History,
  Settings,
  Bell,
  Info,
  Undo2,
  BarChart3,
  Package,
  Users,
  Archive,
  Store
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
import { AnimatedLogo } from './animated-logo';


const BreadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.8 5.7A2.5 2.5 0 0 0 16 5H8a2.5 2.5 0 0 0-1.8 4.3l5.1 6.8c.4.6.3 1.4-.2 1.8-1.5 1.2-4.2 1.2-5.7 0-1.8-1.5-1.8-4.2 0-5.7.5-.4 1.2-.4 1.7 0l.3.3" />
      <path d="M18 13.3a2.5 2.5 0 0 0-1.8-4.3H8.3a2.5 2.5 0 0 0-1.8 4.3l5.1 6.8c.4.6.3 1.4-.2 1.8-1.5 1.2-4.2 1.2-5.7 0-1.8-1.5-1.8-4.2 0-5.7.5-.4 1.2-.4 1.7 0l.3.3" />
      <path d="M22 13.3a2.5 2.5 0 0 0-1.8-4.3h-7.9a2.5 2.5 0 0 0-1.8 4.3l5.1 6.8c.4.6.3 1.4-.2 1.8-1.5 1.2-4.2 1.2-5.7 0-1.8-1.5-1.8-4.2 0-5.7.5-.4 1.2-.4 1.7 0l.3.3" />
    </svg>
  );

const navLinks = [
  { href: '/sell', label: 'Vente', icon: Store },
  { href: '/dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/bread', label: 'Pain', icon: BreadIcon },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/customers', label: 'Clients', icon: Users },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/sales-history', label: 'Historique', icon: History },
  { href: '/returns', label: 'Retours', icon: Undo2 },
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

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:px-6 print-hide sticky top-0 z-10">
      <div className="flex-1 flex justify-start">
         <div className="flex items-baseline gap-2">
              <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
              >
                  <span className="text-2xl">🏪</span>
                  <AnimatedLogo />
              </Link>
              <span className="text-xs text-muted-foreground hidden lg:inline">Développé par zenagui bilal</span>
          </div>
      </div>


        {/* Central Navigation */}
        <div className="flex-1 flex justify-center">
            <TooltipProvider>
                <nav className="hidden md:flex items-center gap-1 rounded-full border bg-card p-1">
                    {navLinks.map(link => (
                        <Tooltip key={link.href}>
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
                    <DropdownMenuItem onClick={() => router.push('/about')}>
                        <Info className="mr-2 h-4 w-4" />
                        <span>À propos</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    </header>
  );
}

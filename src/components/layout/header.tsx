
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  LogOut,
  User as UserIcon,
  Store,
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

const navLinks = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/sell', label: 'Vendre' },
  { href: '/products', label: 'Produits' },
  { href: '/stock-intake', label: 'Réception Stock' },
  { href: '/customers', label: 'Clients' },
  { href: '/bread-orders', label: 'Commandes de Pain' },
  { href: '/sales-history', label: 'Historique' },
  { href: '/notifications', label: 'Alertes' },
  { href: '/profile', label: 'Profil' },
  { href: '/customers/[id]', label: 'Détails du client'},
  { href: '/stock-intake/history', label: 'Historique des réceptions'}
];


export function AppHeader() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };

  // Find the label for the current page
  let currentPageLabel = navLinks.find(link => {
    if (link.href.includes('[id]')) {
        const baseHref = link.href.split('[id]')[0];
        return pathname.startsWith(baseHref);
    }
    return pathname === link.href;
  })?.label;

  if (!currentPageLabel && pathname === '/') {
      currentPageLabel = "Accueil"
  }


  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2">
        <Link
            href="/"
            className="flex items-center gap-2 font-semibold"
        >
            <Store className="h-6 w-6" />
            <span className="sr-only">iPOS</span>
        </Link>
        <div className="flex items-center gap-2">
            <Link href="/" className="transition-colors hover:text-foreground">
                <Home className="h-5 w-5" />
                <span className="sr-only">Accueil</span>
            </Link>
            <h1 className="text-xl font-semibold">{currentPageLabel || 'Page'}</h1>
        </div>

        <div className="ml-auto flex items-center gap-4">
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
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil</span>
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

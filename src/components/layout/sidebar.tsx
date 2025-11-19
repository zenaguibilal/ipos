
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  PanelLeft,
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth, useUser } from '@/firebase';

const navLinks = [
  { href: '/dashboard', icon: Home, label: 'Tableau de bord' },
  { href: '/sell', icon: ShoppingCart, label: 'Vendre' },
  { href: '/products', icon: Package, label: 'Produits' },
  { href: '/customers', icon: Users, label: 'Clients' },
  { href: '/sales-history', icon: LineChart, label: 'Historique' },
];

function NavLink({
  href,
  icon: Icon,
  label,
  isMobile = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary',
        isMobile && 'text-lg'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
      router.push('/');
    }
  };
  
  if (isUserLoading) {
     return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }
  
  if (!user) {
    // This case might be hit briefly during redirect. Or if a user lands on a protected page when logged out.
    // The individual pages already handle the redirect logic.
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Redirection vers la page de connexion...</p>
        </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Store className="h-6 w-6" />
              <span className="">iPOS</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map((link) => (
                <NavLink key={link.href} {...link} />
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu de navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-4 text-lg font-medium">
                    <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                    >
                    <Store className="h-6 w-6" />
                    <span className="">iPOS</span>
                    </Link>
                    {navLinks.map((link) => (
                        <NavLink key={link.href} {...link} isMobile />
                    ))}
                </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">Menu utilisateur</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

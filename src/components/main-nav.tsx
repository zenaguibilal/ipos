'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  Users,
  Truck,
  Bell,
  Cookie,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetClose } from './ui/sheet';

const navLinks = [
  { href: '/sell', label: 'Vendre', icon: ShoppingCart },
  { href: '/alerts', label: 'Alertes', icon: Bell },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/customers', label: 'Clients', icon: Users },
  { href: '/suppliers', label: 'Fournisseurs', icon: Truck },
  { href: '/bakery', label: 'Pâtisserie', icon: Cookie },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

type MainNavProps = {
  isMobile?: boolean;
};

export function MainNav({ isMobile = false }: MainNavProps) {
  const pathname = usePathname();

  const NavLink = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
  }) => {
    const isActive = pathname === href;
    const linkContent = (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
          isActive
            ? 'bg-muted text-primary'
            : 'text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );

    if (isMobile) {
      return <SheetClose asChild>{linkContent}</SheetClose>;
    }

    return linkContent;
  };

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navLinks.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}

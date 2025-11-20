
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/settings/profile', label: 'Profil' },
  { href: '/settings/company', label: 'Entreprise' },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === item.href
              ? 'bg-muted text-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

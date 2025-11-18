'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSales } from '@/lib/data';
import Image from 'next/image';
import { Loader } from 'lucide-react';

export function RecentSales() {
  const { sales, isLoading } = useSales(5);

  if (isLoading) {
    return <div className="flex justify-center items-center"><Loader className="animate-spin" /></div>
  }

  if (!sales || sales.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent sales found.</p>
  }

  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <Image
              src={sale.customer?.avatarUrl || `https://picsum.photos/seed/${sale.customerId}/100/100`}
              alt={`Avatar of ${sale.customer?.name || 'customer'}`}
              width={36}
              height={36}
              data-ai-hint={sale.customer?.avatarHint || 'person portrait'}
            />
            <AvatarFallback>
              {sale.customer?.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {sale.customer?.name || 'Unknown Customer'}
            </p>
            <p className="text-sm text-muted-foreground">
              {sale.customer?.email || 'No email'}
            </p>
          </div>
          <div className="ml-auto font-medium">
            +{(sale.totalAmount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
      ))}
    </div>
  );
}

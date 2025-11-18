import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSales } from '@/lib/data';
import Image from 'next/image';

export async function RecentSales() {
  const sales = (await getSales()).slice(0, 5);

  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <Image
              src={sale.customer.avatarUrl}
              alt={`Avatar of ${sale.customer.name}`}
              width={36}
              height={36}
              data-ai-hint={sale.customer.avatarHint}
            />
            <AvatarFallback>
              {sale.customer.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {sale.customer.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {sale.customer.email}
            </p>
          </div>
          <div className="ml-auto font-medium">
            +${(sale.amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
      ))}
    </div>
  );
}

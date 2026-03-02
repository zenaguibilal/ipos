
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopCustomer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { User, Users } from "lucide-react";
import Link from 'next/link';

interface TopCustomersProps {
    customers: TopCustomer[];
    isLoading: boolean;
}

export default function TopCustomers({ customers, isLoading }: TopCustomersProps) {

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Meilleurs Clients</CardTitle>
        <CardDescription>
          Les clients les plus fidèles de la période.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {customers.length > 0 ? (
            <div className="space-y-2">
            {customers.map((customer) => (
              <Link href={`/customers/${customer.id}`} key={customer.id} className="flex items-center p-3 rounded-lg transition-colors hover:bg-primary/5">
                <div className="p-3 bg-muted rounded-full mr-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-grow space-y-1">
                  <p className="text-sm font-medium leading-none">{customer.name}</p>
                   <p className="text-xs text-muted-foreground">
                    ID: {customer.id}
                  </p>
                </div>
                <div className="ml-auto font-bold text-primary text-right">
                    {formatCurrency(customer.totalSpent)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-primary/20">
                 <Users className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucune donnée client disponible.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

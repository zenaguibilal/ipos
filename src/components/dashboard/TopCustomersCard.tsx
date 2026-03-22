'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TopCustomer } from '@/lib/types';
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "../ui/button";
import { Users, User } from "lucide-react";

export function TopCustomersCard({ customers }: { customers: TopCustomer[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meilleurs Clients</CardTitle>
        <CardDescription>Les clients qui ont le plus dépensé sur la période.</CardDescription>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Aucune donnée client.</p>
        ) : (
          <ScrollArea className="h-60">
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center">
                  <div className="p-2 bg-muted rounded-full mr-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{customer.name}</p>
                  </div>
                  <div className="ml-auto font-medium text-right">
                    <p>{formatCurrency(customer.totalSpent)}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
       {customers.length > 0 && (
        <CardFooter>
             <Button asChild className="w-full">
                <Link href="/customers">
                    <Users className="mr-2 h-4 w-4" /> Voir tous les clients
                </Link>
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}

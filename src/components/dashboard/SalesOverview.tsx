'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton";
import type { TopProduct, TopCustomer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";

interface SalesOverviewProps {
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    isLoading: boolean;
}

export default function SalesOverview({ topProducts, topCustomers, isLoading }: SalesOverviewProps) {

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                     <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="grid gap-6">
                     <div>
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div>
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Aperçu des Ventes</CardTitle>
                <CardDescription>Produits et clients les plus performants.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 flex-grow">
                <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Meilleurs Produits</h3>
                    <ScrollArea className="h-48">
                        {topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topProducts.map((product) => (
                                    <div key={product.id} className="flex items-center">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.unitsSold} unités vendues</p>
                                        </div>
                                        <div className="ml-auto font-medium text-primary">{formatCurrency(product.totalRevenue)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground pt-4">Aucun produit vendu dans cette période.</p>}
                    </ScrollArea>
                </div>
                <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Meilleurs Clients</h3>
                    <ScrollArea className="h-32">
                         {topCustomers.length > 0 ? (
                             <div className="space-y-4">
                                {topCustomers.map((customer) => (
                                    <div key={customer.id} className="flex items-center">
                                        <p className="text-sm font-medium leading-none truncate">{customer.name}</p>
                                        <div className="ml-auto font-medium">{formatCurrency(customer.totalSpent)}</div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" asChild>
                                            <Link href={`/customers/${customer.id}`}><ArrowUpRight className="h-4 w-4" /></Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-sm text-muted-foreground pt-4">Aucune vente associée à des clients.</p>}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}

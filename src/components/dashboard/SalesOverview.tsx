'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton";
import type { TopProduct, TopCustomer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
                    <CardTitle>Aperçu des Ventes</CardTitle>
                    <CardDescription>Produits et clients les plus performants.</CardDescription>
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
        <Card>
            <CardHeader>
                <CardTitle>Aperçu des Ventes</CardTitle>
                <CardDescription>Produits et clients les plus performants.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div>
                    <h3 className="text-sm font-semibold mb-2">Meilleurs Produits</h3>
                    <ScrollArea className="h-48">
                        {topProducts.length > 0 ? (
                            <div className="space-y-4">
                                {topProducts.map((product, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.unitsSold} unités vendues</p>
                                        </div>
                                        <div className="ml-auto font-medium text-primary">{formatCurrency(product.totalRevenue)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">Aucun produit vendu.</p>}
                    </ScrollArea>
                </div>
                <div>
                    <h3 className="text-sm font-semibold mb-2">Meilleurs Clients</h3>
                    <ScrollArea className="h-32">
                         {topCustomers.length > 0 ? (
                             <div className="space-y-4">
                                {topCustomers.map((customer, index) => (
                                    <div key={index} className="flex items-center">
                                        <p className="text-sm font-medium leading-none truncate">{customer.name}</p>
                                        <div className="ml-auto font-medium">{formatCurrency(customer.totalSpent)}</div>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-sm text-muted-foreground">Aucun client enregistré sur les ventes.</p>}
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    )
}


'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDollarSign, ShoppingBag, Archive, TrendingUp, Warehouse, WalletCards, Calculator, Boxes } from "lucide-react";

interface StatsCardsProps {
    revenue: number;
    netProfit: number;
    salesCount: number;
    lowStockCount: number;
    inventoryValue: number;
    totalOutstandingDebt: number;
    averageSaleValue: number;
    averageItemsPerSale: number;
}

export function StatsCards({ revenue, netProfit, salesCount, lowStockCount, inventoryValue, totalOutstandingDebt, averageSaleValue, averageItemsPerSale }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Chiffre d'affaires (période)
                    </CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{revenue.toFixed(1)} DA</div>
                    <p className="text-xs text-muted-foreground">
                        Revenu total sur la période sélectionnée
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Bénéfice net (période)
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{netProfit.toFixed(1)} DA</div>
                     <p className="text-xs text-muted-foreground">
                        Marge bénéficiaire sur la période
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ventes (période)
                    </CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{salesCount}</div>
                     <p className="text-xs text-muted-foreground">
                        Transactions sur la période
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                       Panier moyen (période)
                    </CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageSaleValue.toFixed(1)} DA</div>
                     <p className="text-xs text-muted-foreground">
                        Valeur moyenne de chaque vente
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Articles / Vente (période)
                    </CardTitle>
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{averageItemsPerSale.toFixed(1)}</div>
                     <p className="text-xs text-muted-foreground">
                        Articles moyens par transaction
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valeur du stock (Total)</CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{inventoryValue.toFixed(1)} DA</div>
                    <p className="text-xs text-muted-foreground">
                        Valeur d'achat de l'inventaire
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Stock faible (Total)</CardTitle>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Produits à réapprovisionner
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-destructive/10 border-destructive/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Dettes Clients</CardTitle>
                    <WalletCards className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{totalOutstandingDebt.toFixed(1)} DA</div>
                    <p className="text-xs text-muted-foreground">
                        Montant total dû par les clients
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

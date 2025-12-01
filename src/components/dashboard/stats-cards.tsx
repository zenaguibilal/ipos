
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDollarSign, ShoppingBag, Users, Archive, TrendingUp, Warehouse } from "lucide-react";

interface StatsCardsProps {
    revenue: number;
    netProfit: number;
    salesCount: number;
    totalDebt: number;
    lowStockCount: number;
    inventoryValue: number;
}

export function StatsCards({ revenue, netProfit, salesCount, totalDebt, lowStockCount, inventoryValue }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Chiffre d'affaires (période)
                    </CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{revenue.toFixed(2)} DA</div>
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
                    <div className="text-2xl font-bold">{netProfit.toFixed(2)} DA</div>
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
                    <CardTitle className="text-sm font-medium">Dettes clients (Total)</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDebt.toFixed(2)} DA</div>
                    <p className="text-xs text-muted-foreground">
                        Montant total dû par tous les clients
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
                        Produits nécessitant un réapprovisionnement
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Valeur du stock (Total)</CardTitle>
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{inventoryValue.toFixed(2)} DA</div>
                    <p className="text-xs text-muted-foreground">
                        Valeur d'achat totale de l'inventaire
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}


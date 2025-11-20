
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CircleDollarSign, ShoppingBag, Users, Archive, TrendingUp } from "lucide-react";

interface Stats {
    dailyRevenue: number;
    dailyNetProfit: number;
    dailySalesCount: number;
    totalDebt: number;
    lowStockCount: number;
}

interface StatsCardsProps {
    stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Chiffre d'affaires du jour
                    </CardTitle>
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.dailyRevenue.toFixed(2)} €</div>
                    <p className="text-xs text-muted-foreground">
                        Revenu total des ventes d'aujourd'hui
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Bénéfice net du jour
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.dailyNetProfit.toFixed(2)} €</div>
                     <p className="text-xs text-muted-foreground">
                        Marge bénéficiaire de la journée
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Ventes du jour
                    </CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.dailySalesCount}</div>
                     <p className="text-xs text-muted-foreground">
                        Nombre de transactions aujourd'hui
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dettes clients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalDebt.toFixed(2)} €</div>
                    <p className="text-xs text-muted-foreground">
                        Montant total dû par tous les clients
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Stock faible</CardTitle>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Produits nécessitant un réapprovisionnement
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

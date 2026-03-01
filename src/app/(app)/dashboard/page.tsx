'use client';

import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product, Customer } from '@/lib/types';
import { Users, Package, Archive, PackageWarning } from 'lucide-react';

export default function DashboardPage() {
    const allProducts = useLiveQuery(() => db.products.toArray(), []);
    const allCustomers = useLiveQuery(() => db.customers.toArray(), []);
    
    const globalStats = useMemo(() => {
        const inventoryValue = allProducts?.reduce((sum, p) => sum + ((p.purchasePrice || 0) * (p.quantity || 0)), 0) || 0;
        const lowStockCount = allProducts?.filter(p => p.quantity <= p.minStockLevel).length || 0;
        const totalCustomers = allCustomers?.length || 0;
        const totalProducts = allProducts?.length || 0;
        
        return {
            inventoryValue,
            lowStockCount,
            totalCustomers,
            totalProducts
        };
    }, [allProducts, allCustomers]);

    const formatCurrency = (value: number) => `${value.toFixed(1)} DA`;

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Tableau de Bord</h1>
                    <p className="text-muted-foreground">
                        Aperçu global de votre commerce.
                    </p>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
                <h2 className="text-xl font-bold mb-4">Aperçu Global de l'Entreprise</h2>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valeur du Stock</CardTitle><Archive className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{formatCurrency(globalStats.inventoryValue)}</div><p className="text-xs text-muted-foreground">Valeur totale des produits en stock.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Stock Faible</CardTitle><PackageWarning className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-yellow-600">{globalStats.lowStockCount}</div><p className="text-xs text-muted-foreground">Nombre de produits en stock faible.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Clients Totaux</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{globalStats.totalCustomers}</div><p className="text-xs text-muted-foreground">Nombre total de clients enregistrés.</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Produits Totaux</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{globalStats.totalProducts}</div><p className="text-xs text-muted-foreground">Nombre total de produits uniques.</p></CardContent>
                    </Card>
                </div>
            </div>

        </main>
    );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '@/services/data-service';
import type { Sale, CostingItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package, Truck, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CostingPage() {
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [deliveryCost, setDeliveryCost] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sales = useLiveQuery(() => dataService.getSales({}), [], []);

    const selectedSale = useLiveQuery(() => {
        if (!selectedSaleId) return undefined;
        return dataService.getById<Sale>('sales', parseInt(selectedSaleId));
    }, [selectedSaleId]);

    const saleOptions = useMemo<ComboboxOption[]>(() => {
        if (!sales) return [];
        return sales.map(s => ({
            value: String(s.id!),
            label: `${s.invoiceNumber}`,
            subLabel: `${s.customerName || 'N/A'} - ${format(s.createdAt!, 'd MMM yyyy', { locale: fr })}`
        }));
    }, [sales]);

    const { costingResults, totalPurchaseValue } = useMemo(() => {
        if (!selectedSale) {
            return { costingResults: [], totalPurchaseValue: 0 };
        }

        const saleTotalPurchaseValue = selectedSale.items.reduce((acc, item) => {
            const purchasePrice = item.purchasePrice || 0;
            return acc + (purchasePrice * item.quantity);
        }, 0);

        const delivery = parseFloat(deliveryCost) || 0;

        const results: CostingItem[] = selectedSale.items.map(item => {
            const purchasePrice = item.purchasePrice || 0;
            const totalPurchasePrice = purchasePrice * item.quantity;
            
            const allocatedDeliveryCost = saleTotalPurchaseValue > 0
                ? (totalPurchasePrice / saleTotalPurchaseValue) * delivery
                : 0;
            
            const finalCostPerUnit = purchasePrice + (item.quantity > 0 ? allocatedDeliveryCost / item.quantity : 0);
            const totalFinalCost = finalCostPerUnit * item.quantity;

            return {
                ...item,
                totalPurchasePrice,
                allocatedDeliveryCost,
                finalCostPerUnit,
                totalFinalCost
            };
        });

        return { costingResults: results, totalPurchaseValue: saleTotalPurchaseValue };
    }, [selectedSale, deliveryCost]);
    
    const totalFinalCostValue = totalPurchaseValue + (parseFloat(deliveryCost) || 0);

    const isLoading = sales === undefined || (selectedSaleId && selectedSale === undefined) || !isMounted;

    if (isLoading && isMounted) {
        return (
             <div className="p-4 sm:p-6 space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-48 w-full" />
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Calcul des Coûts par Facture</h1>
                <p className="text-muted-foreground">Calculez le coût final de chaque produit en incluant les frais de transport.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>1. Sélection & Frais</CardTitle>
                    <CardDescription>Choisissez une facture et entrez les frais de transport associés.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Facture</Label>
                        <Combobox
                            options={saleOptions}
                            value={selectedSaleId || ''}
                            onSelect={(value) => setSelectedSaleId(value)}
                            placeholder="Sélectionner une facture..."
                            searchPlaceholder="Rechercher par N° de facture..."
                            notFoundMessage="Aucune facture trouvée."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deliveryCost">Frais de transport (DA)</Label>
                        <Input 
                            id="deliveryCost" 
                            type="number" 
                            value={deliveryCost}
                            onChange={(e) => setDeliveryCost(e.target.value)}
                            placeholder="0"
                            disabled={!selectedSaleId}
                        />
                    </div>
                </CardContent>
            </Card>

            {selectedSale && (
                <>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Coût d'Achat Total</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalPurchaseValue)}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Frais de Transport</CardTitle>
                                <Truck className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(parseFloat(deliveryCost) || 0)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Coût Final Total</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">{formatCurrency(totalFinalCostValue)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Répartition des Coûts</CardTitle>
                            <CardDescription>Détail du coût final pour chaque produit de la facture sélectionnée.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produit</TableHead>
                                            <TableHead className="text-right">Prix d'Achat U.</TableHead>
                                            <TableHead className="text-center">Qté</TableHead>
                                            <TableHead className="text-right">Part Transport</TableHead>
                                            <TableHead className="text-right font-bold">Coût Final U.</TableHead>
                                            <TableHead className="text-right font-bold">Coût Final Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {costingResults.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.purchasePrice)}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatCurrency(item.allocatedDeliveryCost / item.quantity)}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(item.finalCostPerUnit)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatCurrency(item.totalFinalCost)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

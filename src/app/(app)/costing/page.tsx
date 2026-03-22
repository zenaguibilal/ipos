'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { dataService } from '@/services/data-service';
import type { StockIntake, CostingItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Package, Truck, Wallet, Check, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';

export default function CostingPage() {
    const [selectedIntakeId, setSelectedIntakeId] = useState<string | null>(null);
    const [deliveryCost, setDeliveryCost] = useState('');
    const [isApplyingCosts, setIsApplyingCosts] = useState(false);

    const [intakes, setIntakes] = useState<StockIntake[] | undefined>(undefined);
    const [selectedIntake, setSelectedIntake] = useState<StockIntake | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const loadIntakes = useCallback(() => {
        setIsLoading(true);
        dataService.getStockIntakes({}).then(data => {
            setIntakes(data);
            setIsLoading(false);
        });
    }, []);

    useEffect(() => {
        loadIntakes();
    }, [loadIntakes]);

    useEffect(() => {
      if (selectedIntakeId) {
        setIsLoading(true);
        dataService.getById<StockIntake>('stockIntakes', parseInt(selectedIntakeId)).then(data => {
            setSelectedIntake(data);
            setIsLoading(false);
        });
      } else {
        setSelectedIntake(undefined);
      }
    }, [selectedIntakeId]);

    const intakeOptions = useMemo<ComboboxOption[]>(() => {
        if (!intakes) return [];
        return intakes.map(i => ({
            value: String(i.id!),
            label: i.invoiceNumber,
            subLabel: `${i.supplierName} - ${format(i.invoiceDate, 'd MMM yyyy', { locale: fr })}`
        }));
    }, [intakes]);

    const { costingResults, totalPurchaseValue } = useMemo(() => {
        if (!selectedIntake) {
            return { costingResults: [], totalPurchaseValue: 0 };
        }

        const intakeTotalPurchaseValue = selectedIntake.totalValue;
        const delivery = parseFloat(deliveryCost) || 0;

        const results = selectedIntake.items.map((item, index) => {
            const purchasePrice = item.purchasePrice || 0;
            const quantity = item.quantityReceived || 0;
            const totalPurchasePrice = purchasePrice * quantity;
            
            const allocatedDeliveryCost = intakeTotalPurchaseValue > 0
                ? (totalPurchasePrice / intakeTotalPurchaseValue) * delivery
                : 0;
            
            const finalCostPerUnit = purchasePrice + (quantity > 0 ? allocatedDeliveryCost / quantity : 0);
            const totalFinalCost = finalCostPerUnit * quantity;

            return {
                id: item.productId || `item-${index}`,
                name: item.productName,
                price: 0, // Not used, but needed for type compatibility
                purchasePrice: purchasePrice,
                quantity: quantity,
                totalPurchasePrice,
                allocatedDeliveryCost,
                finalCostPerUnit,
                totalFinalCost,
                productId: item.productId
            } as CostingItem;
        });

        return { costingResults: results, totalPurchaseValue: intakeTotalPurchaseValue };
    }, [selectedIntake, deliveryCost]);
    
    const totalFinalCostValue = totalPurchaseValue + (parseFloat(deliveryCost) || 0);

    const handleApplyCosts = async () => {
        if (costingResults.length === 0) {
            toast.error("Aucun coût à appliquer.");
            return;
        }
        setIsApplyingCosts(true);
        try {
            await dataService.applyNewPurchasePrices(costingResults);
            toast.success("Les nouveaux coûts d'achat ont été appliqués avec succès !");
        } catch (error) {
            toast.error("Erreur lors de l'application des nouveaux coûts.");
            console.error(error);
        } finally {
            setIsApplyingCosts(false);
        }
    };

    if (isLoading) {
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
            <PageHeader 
                title="Calcul des Coûts par Réception"
                description="Calculez le coût final de chaque produit d'une réception en incluant les frais de transport."
            />

            <Card>
                <CardHeader>
                    <CardTitle>1. Sélection & Frais</CardTitle>
                    <CardDescription>Choisissez une réception de stock et entrez les frais de transport associés.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Réception</Label>
                        <Combobox
                            options={intakeOptions}
                            value={selectedIntakeId || ''}
                            onSelect={(value) => setSelectedIntakeId(value)}
                            placeholder="Sélectionner une réception..."
                            searchPlaceholder="Rechercher par N° ou fournisseur..."
                            notFoundMessage="Aucune réception trouvée."
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
                            disabled={!selectedIntakeId}
                        />
                    </div>
                </CardContent>
            </Card>

            {selectedIntake && (
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
                            <CardDescription>Détail du coût final pour chaque produit de la réception sélectionnée.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produit</TableHead>
                                            <TableHead className="text-right">Prix d'Achat U.</TableHead>
                                            <TableHead className="text-center">Qté</TableHead>
                                            <TableHead className="text-right">Part Transport U.</TableHead>
                                            <TableHead className="text-right font-bold">Coût Final U.</TableHead>
                                            <TableHead className="text-right font-bold">Coût Final Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {costingResults.map(item => (
                                            <TableRow key={String(item.id)}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.purchasePrice)}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right text-muted-foreground">{formatCurrency(item.allocatedDeliveryCost / (item.quantity || 1))}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(item.finalCostPerUnit)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary">{formatCurrency(item.totalFinalCost)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold">Appliquer les coûts</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Mettre à jour le prix d'achat de ces produits avec le "Coût Final U." calculé.
                                </p>
                            </div>
                            <Button onClick={handleApplyCosts} disabled={isApplyingCosts || costingResults.length === 0}>
                                {isApplyingCosts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Appliquer les coûts
                            </Button>
                        </CardFooter>
                    </Card>
                </>
            )}
        </div>
    );
}

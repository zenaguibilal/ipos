'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { salesService } from '@/services/sales.service';
import type { Sale, ReturnItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Search, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppActions } from '@/stores/appStore';

type ReturnItemState = ReturnItem & { originalQuantity: number, returnQuantity: number };

export default function NewReturnPage() {
    const router = useRouter();
    const { processReturn } = useAppActions();
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
    const [amountRefunded, setAmountRefunded] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSearchSale = async () => {
        if (!invoiceNumber) return;
        setIsSearching(true);
        try {
            const sale = await salesService.getSaleByInvoiceNumber(invoiceNumber);
            if (sale) {
                setFoundSale(sale);
                const items: ReturnItemState[] = sale.items.map(item => ({
                    productUuid: item.productUuid,
                    productName: item.name,
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    quantity: item.quantity, // this will become returnQuantity in the service
                    originalQuantity: item.quantity,
                    returnQuantity: 0, // start with 0 to return
                    wasRestocked: true,
                }));
                setReturnItems(items);
            } else {
                toast.error(`Facture n° ${invoiceNumber} non trouvée.`);
                setFoundSale(null);
                setReturnItems([]);
            }
        } catch (error: any) {
            toast.error("Erreur lors de la recherche de la facture.", { description: error.message });
        } finally {
            setIsSearching(false);
        }
    };

    const handleItemChange = (index: number, field: 'returnQuantity' | 'wasRestocked', value: any) => {
        setReturnItems(items => {
            const newItems = [...items];
            const item = newItems[index];
            if (!item) return items;

            if (field === 'returnQuantity') {
                const newQty = Math.max(0, Math.min(item.originalQuantity, Number(value)));
                newItems[index] = { ...item, returnQuantity: newQty, quantity: newQty };
            } else {
                newItems[index] = { ...item, wasRestocked: value };
            }
            return newItems;
        });
    };
    
    const totalReturnValue = returnItems.reduce((acc, item) => acc + (item.price * item.returnQuantity), 0);
    const hasItemsToReturn = returnItems.some(item => item.returnQuantity > 0);

    const handleSaveReturn = async () => {
        if (!foundSale || !hasItemsToReturn) {
            toast.error("Veuillez sélectionner au moins un article à retourner.");
            return;
        }

        setIsSaving(true);
        try {
            const itemsForService = returnItems.filter(item => item.returnQuantity > 0);

            await processReturn({
                originalSaleUuid: foundSale.uuid,
                items: itemsForService,
                totalReturnValue,
                amountRefunded,
                customerUuid: foundSale.customerUuid,
                notes,
            });

            toast.success("Retour enregistré avec succès !");
            router.push('/returns');

        } catch (error: any) {
            // Error is already toasted by the store action, but we can log it too.
            console.error("Failed to save return:", error);
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Nouveau Retour de Produit"
                description="Enregistrez un retour sur la base d'une vente existante."
            >
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving || !hasItemsToReturn}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Enregistrement...' : 'Enregistrer le Retour'}
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>1. Rechercher la Vente Originale</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <Input
                        placeholder="Entrez le numéro de la facture..."
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                        disabled={!!foundSale}
                    />
                    <Button onClick={handleSearchSale} disabled={isSearching || !!foundSale}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Rechercher
                    </Button>
                     {foundSale && (
                        <Button variant="outline" onClick={() => { setFoundSale(null); setInvoiceNumber(''); setReturnItems([])}}>
                            Changer
                        </Button>
                    )}
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Sélectionner les Articles à Retourner</CardTitle>
                            <CardDescription>
                                Facture: {foundSale.invoiceNumber} | Client: {foundSale.customerUuid ? 'Associé' : 'Client de passage'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-left">Produit</th>
                                            <th className="p-2 text-center w-24">Qté Vendue</th>
                                            <th className="p-2 text-center w-32">Qté à Retourner</th>
                                            <th className="p-2 text-right w-32">Prix Unitaire</th>
                                            <th className="p-2 text-center w-32">Réintégrer au Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map((item, index) => (
                                            <tr key={(item.productUuid || `custom-${index}`) + index} className="border-b">
                                                <td className="p-2 font-medium">{item.productName}</td>
                                                <td className="p-2 text-center">{item.originalQuantity}</td>
                                                <td className="p-2">
                                                    <Input 
                                                        type="number" 
                                                        className="text-center" 
                                                        value={item.returnQuantity} 
                                                        onChange={e => handleItemChange(index, 'returnQuantity', e.target.value)}
                                                        max={item.originalQuantity}
                                                        min={0}
                                                    />
                                                </td>
                                                <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                                <td className="p-2 text-center">
                                                    <Switch
                                                        checked={item.wasRestocked}
                                                        onCheckedChange={value => handleItemChange(index, 'wasRestocked', value)}
                                                        disabled={!item.productUuid}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Finaliser le Retour</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amountRefunded">Montant à rembourser (DA)</Label>
                                    <Input
                                        id="amountRefunded"
                                        type="number"
                                        value={amountRefunded}
                                        onChange={e => setAmountRefunded(Number(e.target.value))}
                                        max={totalReturnValue}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (facultatif)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Raison du retour, état du produit, etc."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold">Résumé du Retour</h4>
                                <div className="flex justify-between">
                                    <span>Valeur totale des articles retournés</span>
                                    <span className="font-bold">{formatCurrency(totalReturnValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Montant remboursé</span>
                                    <span>{formatCurrency(amountRefunded)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Impact sur le solde client</span>
                                    <span className={cn(totalReturnValue - amountRefunded >= 0 ? 'text-chart-quaternary' : 'text-destructive')}>
                                        {totalReturnValue - amountRefunded >= 0 ? `- ${formatCurrency(totalReturnValue - amountRefunded)}` : `+ ${formatCurrency(Math.abs(totalReturnValue - amountRefunded))}`}
                                    </span>
                                </div>
                                {foundSale.customerUuid && (
                                     <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-background rounded">
                                        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                        <span>Un nombre négatif réduit la dette du client. Un nombre positif l'augmente (si le remboursement est supérieur à la valeur du retour).</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            )}
        </div>
    );
}

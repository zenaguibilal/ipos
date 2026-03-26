
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
import { ArrowLeft, Search, Save, Loader2, Info, X, User, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppActions } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';

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
                    quantity: 0, 
                    originalQuantity: item.quantity,
                    returnQuantity: 0, 
                    wasRestocked: true,
                }));
                setReturnItems(items);
                setAmountRefunded(0);
                toast.success("Facture trouvée.");
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
            const success = await processReturn({
                originalSaleUuid: foundSale.uuid,
                items: returnItems.filter(item => item.returnQuantity > 0),
                totalReturnValue,
                amountRefunded,
                customerUuid: foundSale.customerUuid,
                notes,
            });

            if (success) {
                router.push('/returns');
            }
        } catch (error) {
            // Error is handled in store
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Nouveau Retour de Produit"
                description="Enregistrez un retour sur la base d'une vente existante pour ajuster le stock et le solde client."
            >
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving || !hasItemsToReturn} className="bg-destructive hover:bg-destructive/90">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Enregistrement...' : 'Valider le Retour'}
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Card className="luxury-glass border-primary/10">
                <CardHeader>
                    <CardTitle className="text-lg">1. Rechercher la Vente Originale</CardTitle>
                    <CardDescription>Saisissez le numéro de facture pour charger les articles.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Ex: 240815-123"
                            className="pl-10 h-11"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                            disabled={!!foundSale}
                        />
                    </div>
                    <Button onClick={handleSearchSale} disabled={isSearching || !!foundSale} className="h-11 px-6">
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Rechercher
                    </Button>
                     {foundSale && (
                        <Button variant="outline" onClick={() => { setFoundSale(null); setInvoiceNumber(''); setReturnItems([])}} className="h-11">
                            <X className="mr-2 h-4 w-4" /> Changer
                        </Button>
                    )}
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <Card className="luxury-glass border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">2. Sélectionner les Articles à Retourner</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono">Facture: {foundSale.invoiceNumber}</Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {foundSale.customerUuid ? 'Client Fidèle' : 'Client de passage'}
                                    </Badge>
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="border-b">
                                            <th className="p-3 text-left font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Produit</th>
                                            <th className="p-3 text-center w-24 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Qté Vendue</th>
                                            <th className="p-3 text-center w-32 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Qté à Retourner</th>
                                            <th className="p-3 text-right w-32 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Prix Unit.</th>
                                            <th className="p-3 text-center w-32 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Réintégrer Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map((item, index) => (
                                            <tr key={(item.productUuid || `custom-${index}`) + index} className={cn("border-b last:border-0", item.returnQuantity > 0 && "bg-destructive/5")}>
                                                <td className="p-3">
                                                    <p className="font-bold">{item.productName}</p>
                                                    {!item.productUuid && <span className="text-[10px] text-muted-foreground">Article personnalisé</span>}
                                                </td>
                                                <td className="p-3 text-center font-mono">{item.originalQuantity}</td>
                                                <td className="p-3">
                                                    <Input 
                                                        type="number" 
                                                        className="h-8 text-center font-bold" 
                                                        value={item.returnQuantity} 
                                                        onChange={e => handleItemChange(index, 'returnQuantity', e.target.value)}
                                                        max={item.originalQuantity}
                                                        min={0}
                                                    />
                                                </td>
                                                <td className="p-3 text-right font-medium">{formatCurrency(item.price)}</td>
                                                <td className="p-3 text-center">
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
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="luxury-glass">
                            <CardHeader>
                                <CardTitle className="text-lg">3. Détails financiers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amountRefunded">Montant Remboursé en Espèces (DA)</Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="amountRefunded"
                                            type="number"
                                            className="pl-10 h-11 text-lg font-bold"
                                            value={amountRefunded}
                                            onChange={e => setAmountRefunded(Number(e.target.value))}
                                            max={totalReturnValue}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Si vous ne remboursez rien, la valeur totale sera créditée sur le solde du client.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes / Raison du retour</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Ex: Produit défectueux, erreur de taille..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="min-h-[100px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="luxury-glass bg-destructive/5 border-destructive/20 h-full flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg text-destructive">Résumé de l'opération</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Valeur des articles retournés</span>
                                        <span className="font-bold">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Montant déjà remboursé</span>
                                        <span className="font-bold text-chart-quaternary">{formatCurrency(amountRefunded)}</span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-destructive/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-destructive">Impact sur le solde</span>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-destructive">
                                                    {totalReturnValue - amountRefunded >= 0 ? `- ${formatCurrency(totalReturnValue - amountRefunded)}` : `+ ${formatCurrency(Math.abs(totalReturnValue - amountRefunded))}`}
                                                </p>
                                                <p className="text-[10px] uppercase font-bold opacity-70">Réduction de dette</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {foundSale?.customerUuid && (
                                     <div className="flex items-start gap-3 text-xs text-destructive/80 p-4 bg-background/50 rounded-xl mt-4">
                                        <Info className="h-5 w-5 flex-shrink-0" />
                                        <p>Ce client a une dette. Le montant non remboursé sera automatiquement déduit de son solde impayé.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            )}
        </div>
    );
}

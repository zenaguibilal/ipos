
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
import { ArrowLeft, Search, Save, Loader2, Info, X, User, Banknote, PackageCheck, PackageX } from 'lucide-react';
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
                     <Button variant="outline" size="icon" asChild className="rounded-xl luxury-glass border-primary/20">
                        <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving || !hasItemsToReturn} className="bg-destructive hover:bg-destructive/90 rounded-xl shadow-lg shadow-destructive/20 h-11 px-6">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Enregistrement...' : 'Valider le Retour'}
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Card className="luxury-glass border-primary/10 overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        1. Rechercher la Vente Originale
                    </CardTitle>
                    <CardDescription>Saisissez le numéro de facture pour charger les articles.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ex: 240815-123"
                                className="pl-10 h-12 rounded-xl border-primary/10 bg-background/50 text-lg font-mono"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                                disabled={!!foundSale}
                            />
                        </div>
                        <Button onClick={handleSearchSale} disabled={isSearching || !!foundSale} className="h-12 px-8 rounded-xl shrink-0">
                            {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Charger Facture
                        </Button>
                         {foundSale && (
                            <Button variant="outline" onClick={() => { setFoundSale(null); setInvoiceNumber(''); setReturnItems([])}} className="h-12 rounded-xl luxury-glass border-primary/20">
                                <X className="mr-2 h-4 w-4" /> Changer
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="luxury-glass border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between bg-primary/5">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Undo2 className="h-5 w-5 text-destructive" />
                                    2. Sélectionner les Articles à Retourner
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono bg-background/50">Facture: {foundSale.invoiceNumber}</Badge>
                                    <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
                                        <User className="h-3 w-3" />
                                        {foundSale.customerUuid ? 'Client Fidèle' : 'Client de passage'}
                                    </Badge>
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30">
                                        <tr className="border-b border-primary/5">
                                            <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-muted-foreground">Produit</th>
                                            <th className="p-4 text-center w-24 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Qté Vendue</th>
                                            <th className="p-4 text-center w-32 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Qté à Retourner</th>
                                            <th className="p-4 text-right w-32 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Prix Unit.</th>
                                            <th className="p-4 text-center w-32 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Action Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map((item, index) => (
                                            <tr key={(item.productUuid || `custom-${index}`) + index} className={cn("border-b border-primary/5 transition-colors", item.returnQuantity > 0 ? "bg-destructive/5" : "hover:bg-muted/20")}>
                                                <td className="p-4">
                                                    <p className="font-bold text-base">{item.productName}</p>
                                                    {!item.productUuid && <Badge variant="outline" className="text-[9px] h-4 font-black opacity-60">ARTICLE PERSONNALISÉ</Badge>}
                                                </td>
                                                <td className="p-4 text-center font-mono font-bold text-muted-foreground">{item.originalQuantity}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-center">
                                                        <Input 
                                                            type="number" 
                                                            className="h-10 w-20 text-center font-black text-lg rounded-lg border-primary/10 focus:border-destructive/30" 
                                                            value={item.returnQuantity} 
                                                            onChange={e => handleItemChange(index, 'returnQuantity', e.target.value)}
                                                            max={item.originalQuantity}
                                                            min={0}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold">{formatCurrency(item.price)}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn("text-[9px] font-black uppercase tracking-tighter", item.wasRestocked ? "text-green-500" : "text-muted-foreground opacity-50")}>Remettre</span>
                                                            <Switch
                                                                checked={item.wasRestocked}
                                                                onCheckedChange={value => handleItemChange(index, 'wasRestocked', value)}
                                                                disabled={!item.productUuid}
                                                                className="data-[state=checked]:bg-green-500"
                                                            />
                                                            <span className={cn("text-[9px] font-black uppercase tracking-tighter", !item.wasRestocked ? "text-destructive" : "text-muted-foreground opacity-50")}>Perte</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {item.wasRestocked ? <PackageCheck className="h-3 w-3 text-green-500" /> : <PackageX className="h-3 w-3 text-destructive" />}
                                                            <span className="text-[10px] font-medium text-muted-foreground">{item.wasRestocked ? 'En stock' : 'Déclassé'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="luxury-glass border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Banknote className="h-5 w-5 text-chart-quaternary" />
                                    3. Modalités Financières
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="amountRefunded" className="text-sm font-bold flex items-center gap-2">
                                        Montant Remboursé en Espèces (DA)
                                        <Info className="h-3 w-3 text-muted-foreground" title="Montant sorti physiquement de la caisse" />
                                    </Label>
                                    <div className="relative">
                                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-chart-quaternary" />
                                        <Input
                                            id="amountRefunded"
                                            type="number"
                                            className="pl-12 h-14 text-2xl font-black rounded-xl border-primary/10 bg-background/50 focus:border-chart-quaternary/30"
                                            value={amountRefunded}
                                            onChange={e => setAmountRefunded(Number(e.target.value))}
                                            max={totalReturnValue}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black leading-relaxed">
                                        Note: Tout montant non remboursé sera automatiquement déduit du solde impayé du client s'il est identifié.
                                    </p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <Label htmlFor="notes" className="text-sm font-bold">Raison du retour / Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Ex: Produit défectueux, erreur de taille, convenance client..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="min-h-[120px] rounded-xl border-primary/10 bg-background/50 focus:border-primary/30"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="luxury-glass bg-destructive/5 border-destructive/20 h-full flex flex-col overflow-hidden">
                            <CardHeader className="bg-destructive/10 pb-4">
                                <CardTitle className="text-lg text-destructive font-black uppercase tracking-widest">Résumé de l'opération</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex-grow flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm p-3 bg-background/40 rounded-xl">
                                        <span className="text-muted-foreground font-medium">Valeur totale des articles</span>
                                        <span className="font-black text-lg">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm p-3 bg-chart-quaternary/5 rounded-xl border border-chart-quaternary/10">
                                        <span className="text-chart-quaternary font-bold flex items-center gap-2">
                                            <Banknote className="h-4 w-4" /> Remboursement cash
                                        </span>
                                        <span className="font-black text-chart-quaternary text-lg">{formatCurrency(amountRefunded)}</span>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-destructive/10">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-black text-destructive uppercase tracking-widest opacity-70">Impact sur le solde client</span>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-destructive">
                                                    {totalReturnValue - amountRefunded >= 0 ? `- ${formatCurrency(totalReturnValue - amountRefunded)}` : `+ ${formatCurrency(Math.abs(totalReturnValue - amountRefunded))}`}
                                                </p>
                                                <div className="flex items-center gap-1.5 justify-end mt-1">
                                                    <HandCoins className="h-4 w-4 text-primary" />
                                                    <p className="text-[10px] uppercase font-black text-primary tracking-tighter">Réduction de dette immédiate</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {foundSale?.customerUuid ? (
                                     <div className="flex items-start gap-3 text-xs text-destructive/80 p-4 bg-destructive/10 rounded-xl mt-6 border border-destructive/20">
                                        <Info className="h-5 w-5 flex-shrink-0" />
                                        <p className="leading-relaxed">
                                            Ce client est identifié. Le montant de <span className="font-bold">{formatCurrency(totalReturnValue - amountRefunded)}</span> sera déduit de sa dette totale chez iPOS dès la validation.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 text-xs text-muted-foreground p-4 bg-muted/30 rounded-xl mt-6 border border-border/50">
                                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-500" />
                                        <p className="leading-relaxed italic">
                                            Vente de passage : Aucun impact sur le solde client ne sera enregistré. Le remboursement doit être fait intégralement en espèces.
                                        </p>
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


'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Sale, ReturnItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Search, Save, Loader2, Scan, Hash, ShoppingBag, Undo2, Banknote, HandCoins, Info, AlertTriangle, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppActions } from '@/stores/appStore';
import { BarcodeScannerDialog } from '@/components/products/BarcodeScannerDialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * @fileOverview Sovereign Return Factory (Finalized Perfection)
 * واجهة إنشاء المرتجعات السيادية: تحكم دقيق في البنود، الأرصدة، وإعادة التخزين.
 */

type ReturnItemState = ReturnItem & { originalQuantity: number };

export default function NewReturnPage() {
    const router = useRouter();
    const { processReturn } = useAppActions();
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
    const [amountRefunded, setAmountRefunded] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSearchSale = useCallback(async (invNum?: string) => {
        const targetInv = invNum || invoiceNumber;
        if (!targetInv) return;
        
        setIsSearching(true);
        try {
            const sales = await api.get<Sale[]>(`sales`);
            const sale = sales.find(s => s.invoiceNumber === targetInv);
            
            if (sale) {
                setFoundSale(sale);
                const items: ReturnItemState[] = sale.items.map(item => ({
                    productUuid: item.productUuid,
                    productName: item.name,
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    quantity: 0, 
                    originalQuantity: item.quantity,
                    wasRestocked: true,
                }));
                setReturnItems(items);
                setAmountRefunded(0);
                toast.success("Vente identifiée dans le Cloud.");
            } else {
                toast.error(`Référence #${targetInv} introuvable.`);
                setFoundSale(null);
            }
        } catch (error: any) {
            toast.error("Échec de la synchronisation.");
        } finally {
            setIsSearching(false);
        }
    }, [invoiceNumber]);

    const handleItemChange = (index: number, field: 'quantity' | 'wasRestocked', value: any) => {
        setReturnItems(items => {
            const newItems = [...items];
            const item = newItems[index];
            if (!item) return items;

            if (field === 'quantity') {
                const newQty = Math.max(0, Math.min(item.originalQuantity, Number(value)));
                newItems[index] = { ...item, quantity: newQty };
            } else {
                newItems[index] = { ...item, wasRestocked: value };
            }
            return newItems;
        });
    };
    
    const totalReturnValue = useMemo(() => 
        returnItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    , [returnItems]);

    const debtReduction = Math.max(0, totalReturnValue - amountRefunded);

    const handleSaveReturn = async () => {
        if (!foundSale || totalReturnValue <= 0) {
            toast.error("Aucun article à retourner.");
            return;
        }
        setIsSaving(true);
        try {
            const success = await processReturn({
                originalSaleUuid: foundSale.uuid,
                originalInvoiceNumber: foundSale.invoiceNumber,
                items: returnItems.filter(item => item.quantity > 0),
                totalReturnValue,
                amountRefunded,
                customerUuid: foundSale.customerUuid,
                notes,
            });

            if (success) {
                toast.success("Régularisation enregistrée avec succès.");
                router.push('/returns');
            }
        } catch (error) {
            toast.error("Échec de la validation souveraine.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-10 animate-in fade-in duration-1000 max-w-screen-2xl mx-auto pb-24 md:pb-10">
            <PageHeader title="Nouvelle Régularisation" description="Traitement des marchandises retournées و correction des flux financiers.">
                <div className="flex gap-2">
                     <Button variant="outline" asChild className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest luxury-glass border-white/10"><Link href="/returns"><ArrowLeft className="h-4 w-4 mr-2" /> Retour au Registre</Link></Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving || totalReturnValue <= 0} className="bg-destructive hover:bg-destructive/90 shadow-2xl shadow-destructive/20 rounded-2xl h-12 px-10 font-black uppercase text-[10px] tracking-widest gap-3">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Graver le Retour
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <Card className={cn(
                        "luxury-glass border-white/5 bg-muted/10 transition-all duration-500",
                        foundSale && "border-primary/20 bg-primary/[0.02]"
                    )}>
                        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Search className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Identification Flux</CardTitle>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Trouver la facture d'origine</p>
                                </div>
                            </div>
                            {foundSale && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 font-black">ACTIVE_ARCHIVE</Badge>}
                        </CardHeader>
                        <CardContent className="p-8 flex gap-4">
                            <div className="relative flex-grow group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Ex: 240328-9988..." 
                                    value={invoiceNumber} 
                                    onChange={e => setInvoiceNumber(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleSearchSale()}
                                    className="pl-12 h-14 rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-lg"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)} className="h-14 w-14 rounded-2xl border-white/10 hover:bg-primary/10 transition-all">
                                <Scan className="h-6 w-6 text-primary" />
                            </Button>
                            <Button onClick={() => handleSearchSale()} disabled={isSearching} className="h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-widest">
                                {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : 'Charger'}
                            </Button>
                        </CardContent>
                    </Card>

                    {foundSale && (
                        <Card className="luxury-glass border-white/5 overflow-hidden animate-in slide-in-from-bottom-4 duration-700 shadow-2xl">
                            <CardHeader className="bg-white/5 p-8 border-b border-white/5">
                                <CardTitle className="flex items-center gap-4 text-lg font-black uppercase">
                                    <div className="p-2 bg-primary/10 rounded-xl"><ShoppingBag className="h-4 w-4 text-primary" /></div>
                                    Articles de la vente #{foundSale.invoiceNumber}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr className="border-b border-white/5">
                                                <th className="p-6 text-left font-black uppercase text-[10px] tracking-widest text-muted-foreground">Désignation</th>
                                                <th className="p-6 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Initial</th>
                                                <th className="p-6 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Qté Retour</th>
                                                <th className="p-6 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Action Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {returnItems.map((item, index) => (
                                                <tr key={index} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-6">
                                                        <p className="font-bold text-base group-hover:text-primary transition-colors">{item.productName}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40">{formatCurrency(item.price)} / Unité</p>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <Badge variant="outline" className="font-mono h-7 px-3 bg-muted/50">{item.originalQuantity}</Badge>
                                                    </td>
                                                    <td className="p-6">
                                                        <Input 
                                                            type="number" 
                                                            className="h-12 w-24 mx-auto text-center font-black text-lg bg-background/40 border-white/5 focus:border-primary/40" 
                                                            value={item.quantity || ''} 
                                                            onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                                                        />
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className={cn("text-[9px] font-black uppercase transition-opacity", !item.wasRestocked && "opacity-30")}>RE-STOCK</span>
                                                                <Switch checked={item.wasRestocked} onCheckedChange={v => handleItemChange(index, 'wasRestocked', v)} />
                                                                <span className={cn("text-[9px] font-black uppercase transition-opacity", item.wasRestocked && "opacity-30")}>PERTE</span>
                                                            </div>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[8px] font-black uppercase px-2 h-4",
                                                                item.wasRestocked ? "border-green-500/20 text-green-500 bg-green-500/5" : "border-destructive/20 text-destructive bg-destructive/5"
                                                            )}>
                                                                {item.wasRestocked ? 'Inventaire mis à jour' : 'Sortie définitive'}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-8">
                    {foundSale ? (
                        <>
                            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-700">
                                <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Banknote className="h-4 w-4 text-primary" />
                                        Modalités Financières
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Remboursement Cash (DA)</Label>
                                        <div className="relative group">
                                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-chart-quaternary/30 group-focus-within:text-chart-quaternary transition-colors" />
                                            <Input 
                                                type="number" 
                                                value={amountRefunded || ''} 
                                                onChange={e => setAmountRefunded(Number(e.target.value))} 
                                                className="pl-12 h-16 rounded-2xl bg-background/40 border-white/10 focus:border-chart-quaternary/40 font-black text-2xl text-chart-quaternary" 
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-[9px] text-muted-foreground italic px-1">Argent retiré du tiroir-caisse pour le client.</p>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Notes de régularisation</Label>
                                        <Textarea 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            placeholder="Motif du retour (Ex: Défaut fabrication, erreur taille)..." 
                                            className="rounded-2xl bg-background/40 border-white/10 focus:border-primary/40 min-h-[100px] text-sm"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-destructive/5 p-8 border-t border-destructive/10 flex flex-col gap-4">
                                    <div className="w-full flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">Valeur Marchandise</span>
                                        <span className="text-sm font-black">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <HandCoins className="h-4 w-4 text-primary opacity-60" />
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Impact Crédit Client</span>
                                        </div>
                                        <span className="text-2xl font-black text-primary">-{formatCurrency(debtReduction)}</span>
                                    </div>
                                </CardFooter>
                            </Card>

                            <div className="p-8 rounded-[3rem] bg-muted/10 border border-white/5 space-y-6 shadow-inner group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-background rounded-2xl border border-white/10 group-hover:rotate-6 transition-transform">
                                        <Info className="h-6 w-6 text-primary opacity-40" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tighter">Conseil de Gestion</p>
                                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                            "Si vous remboursez intégralement en cash, l'impact sur le solde client sera de zéro DA."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale space-y-6">
                            <div className="h-32 w-32 rounded-full border-4 border-dashed border-muted-foreground flex items-center justify-center">
                                <Undo2 className="h-16 w-16" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-black uppercase tracking-widest">Attente de Archive</p>
                                <p className="text-xs font-bold uppercase tracking-tighter italic">Veuillez d'abord identifier une facture de vente.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleSearchSale} />
        </div>
    );
}

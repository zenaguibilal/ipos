
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
import { ArrowLeft, Search, Save, Loader2, Scan, Hash, ShoppingBag, Undo2, Banknote, HandCoins, Info, AlertTriangle, PackageCheck, FileText, CheckCircle2, User } from 'lucide-react';
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
            // Updated to fetch sales list and find the specific invoice
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
            toast.error("Échec de la synchronisation avec le registre des ventes.");
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
            toast.error("Veuillez sélectionner au moins un article à retourner.");
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
                toast.success("Régularisation enregistrée avec succès.", {
                    description: "Le stock a été mis à jour و le solde client synchronisé."
                });
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
            <PageHeader title="Usine de Régularisation" description="Traitement des marchandises retournées و correction des flux financiers du terminal.">
                <div className="flex gap-2">
                     <Button variant="outline" asChild className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest luxury-glass border-white/10 hover:bg-white/5 transition-all"><Link href="/returns"><ArrowLeft className="h-4 w-4 mr-2" /> Retour au Registre</Link></Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving || totalReturnValue <= 0} className="bg-destructive hover:bg-destructive/90 shadow-2xl shadow-destructive/20 rounded-2xl h-12 px-10 font-black uppercase text-[10px] tracking-[0.2em] gap-3 group">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                            Valider le Retour
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Invoice Lookup */}
                    <Card className={cn(
                        "luxury-glass border-white/5 bg-muted/10 transition-all duration-700",
                        foundSale && "border-primary/20 bg-primary/[0.02]"
                    )}>
                        <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl transition-colors", foundSale ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/40")}>
                                    <Search className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black uppercase tracking-tight">Flux Source</CardTitle>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Identification de la facture à régulariser</p>
                                </div>
                            </div>
                            {foundSale && (
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 font-black uppercase text-[9px] tracking-widest">
                                    <CheckCircle2 className="h-3 w-3 mr-2" />
                                    Archive Verrouillée
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 flex gap-4">
                            <div className="relative flex-grow group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 group-focus-within:text-primary transition-colors" />
                                <Input 
                                    placeholder="Scannez ou tapez le N° Facture (Ex: 240328-9988)..." 
                                    value={invoiceNumber} 
                                    onChange={e => setInvoiceNumber(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && handleSearchSale()}
                                    className="pl-12 h-16 rounded-[1.5rem] bg-background/40 border-white/10 focus:border-primary/40 focus:ring-0 font-bold text-lg shadow-inner"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)} className="h-16 w-16 rounded-[1.5rem] border-white/10 hover:bg-primary/10 transition-all group">
                                <Scan className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                            </Button>
                            <Button onClick={() => handleSearchSale()} disabled={isSearching} className="h-16 px-12 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl">
                                {isSearching ? <Loader2 className="animate-spin h-5 w-5" /> : 'Charger'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Items List */}
                    {foundSale ? (
                        <Card className="luxury-glass border-white/5 overflow-hidden animate-in slide-in-from-bottom-4 duration-700 shadow-2xl">
                            <CardHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row justify-between items-center">
                                <CardTitle className="flex items-center gap-4 text-lg font-black uppercase tracking-tight">
                                    <div className="p-2 bg-primary/10 rounded-xl"><ShoppingBag className="h-4 w-4 text-primary" /></div>
                                    Composition de la vente #{foundSale.invoiceNumber}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground opacity-40" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Client: {foundSale.customerUuid ? 'Compte Cloud' : 'Passage'}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr className="border-b border-white/5">
                                                <th className="p-6 text-left font-black uppercase text-[10px] tracking-widest text-muted-foreground">Désignation de l'article</th>
                                                <th className="p-6 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground w-32">Vendu</th>
                                                <th className="p-6 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground w-40">Qté Retour</th>
                                                <th className="p-6 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Action Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {returnItems.map((item, index) => (
                                                <tr key={index} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-6">
                                                        <p className="font-bold text-base group-hover:text-primary transition-colors uppercase tracking-tight">{item.productName}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40 mt-1">{formatCurrency(item.price)} / Unité</p>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <Badge variant="outline" className="font-mono h-8 px-4 bg-muted/50 border-white/5 text-sm font-black">{item.originalQuantity}</Badge>
                                                    </td>
                                                    <td className="p-6">
                                                        <Input 
                                                            type="number" 
                                                            className="h-14 w-32 mx-auto text-center font-black text-xl bg-background/40 border-white/10 focus:border-primary/40 rounded-xl" 
                                                            value={item.quantity || ''} 
                                                            onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                                                            min="0"
                                                            max={item.originalQuantity}
                                                        />
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="flex items-center gap-4 bg-background/40 p-2 rounded-2xl border border-white/5">
                                                                <span className={cn("text-[10px] font-black uppercase transition-opacity", !item.wasRestocked && "opacity-20")}>Re-Stock</span>
                                                                <Switch checked={item.wasRestocked} onCheckedChange={v => handleItemChange(index, 'wasRestocked', v)} className="data-[state=checked]:bg-green-500" />
                                                                <span className={cn("text-[10px] font-black uppercase transition-opacity", item.wasRestocked && "opacity-20")}>Telf/Perte</span>
                                                            </div>
                                                            <Badge variant="outline" className={cn(
                                                                "text-[8px] font-black uppercase px-3 h-5 tracking-[0.1em]",
                                                                item.wasRestocked ? "border-green-500/20 text-green-500 bg-green-500/5" : "border-destructive/20 text-destructive bg-destructive/5"
                                                            )}>
                                                                {item.wasRestocked ? 'Inventaire incrémenté' : 'Sortie définitive'}
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
                    ) : (
                        <div className="py-32 flex flex-col items-center justify-center text-center opacity-20 grayscale space-y-8 animate-pulse">
                            <Receipt className="h-32 w-32" />
                            <div className="space-y-2">
                                <p className="text-2xl font-black uppercase tracking-widest">En attente de chargement</p>
                                <p className="text-xs font-bold uppercase tracking-[0.2em]">Veuillez identifier une facture valide pour commencer.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {foundSale ? (
                        <>
                            {/* Financial Modalities */}
                            <Card className="luxury-glass border-white/5 bg-muted/10 overflow-hidden shadow-2xl animate-in slide-in-from-right-4 duration-700">
                                <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-primary">
                                        <Banknote className="h-4 w-4" />
                                        Régularisation Financière
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-10">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 flex justify-between items-center">
                                            Remboursement Cash (DA)
                                            <Badge className="bg-chart-quaternary/10 text-chart-quaternary border-0 text-[8px] font-black">SORTIE CAISSE</Badge>
                                        </Label>
                                        <div className="relative group">
                                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-chart-quaternary/30 group-focus-within:text-chart-quaternary transition-colors" />
                                            <Input 
                                                type="number" 
                                                value={amountRefunded || ''} 
                                                onChange={e => setAmountRefunded(Number(e.target.value))} 
                                                className="pl-14 h-20 rounded-[1.5rem] bg-background/40 border-white/10 focus:border-chart-quaternary/40 font-black text-3xl text-chart-quaternary shadow-inner" 
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <p className="text-[9px] text-muted-foreground italic px-1 leading-relaxed">
                                            "Indiquez le montant liquide effectivement rendu au client. Le reste sera automatiquement déduit de son compte crédit."
                                        </p>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Observations & Motif</Label>
                                        <Textarea 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            placeholder="Ex: Défaut technique, erreur de référence, retour de bon voisinage..." 
                                            className="rounded-[1.5rem] bg-background/40 border-white/10 focus:border-primary/40 min-h-[140px] text-sm font-bold shadow-inner resize-none"
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-destructive/5 p-8 border-t border-destructive/10 flex flex-col gap-6">
                                    <div className="w-full flex justify-between items-center px-2">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-[0.2em]">Valeur Restituée</span>
                                        <span className="text-base font-black">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="w-full flex justify-between items-center p-6 bg-background/40 rounded-[1.5rem] border border-white/5 shadow-inner">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <HandCoins className="h-5 w-5 text-primary" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">Impact Solde</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-primary">-{formatCurrency(debtReduction)}</span>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mt-0.5">Correction du compte</p>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>

                            <div className="p-8 rounded-[3rem] bg-muted/10 border border-white/5 space-y-6 shadow-inner group">
                                <div className="flex items-start gap-5">
                                    <div className="p-4 bg-background rounded-2xl border border-white/10 group-hover:rotate-6 transition-transform shadow-xl">
                                        <Info className="h-6 w-6 text-primary opacity-40" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-tighter">Guide de Souveraineté</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                            "Si vous remboursez l'intégralité du retour en cash, l'impact sur le solde client sera de zéro DA. Dans le cas contraire, le système créera un 'avoir' automatique."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale space-y-6 border-2 border-dashed rounded-[3rem] border-white/10 bg-white/5">
                            <div className="h-24 w-24 rounded-full border-4 border-dashed border-muted-foreground flex items-center justify-center">
                                <Undo2 className="h-10 w-10" />
                            </div>
                            <div className="space-y-2 px-8">
                                <p className="text-sm font-black uppercase tracking-widest">Poste de Travail Inactif</p>
                                <p className="text-[9px] font-bold uppercase tracking-tighter italic leading-relaxed">Veuillez d'abord identifier une facture via le terminal de recherche pour débloquer les outils de régularisation.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleSearchSale} />
        </div>
    );
}

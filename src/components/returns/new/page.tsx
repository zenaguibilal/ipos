'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Search, Save, Loader2, Info, X, User, Banknote, Scan, Undo2, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppActions } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { BarcodeScannerDialog } from '@/components/products/BarcodeScannerDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Sale, ReturnItem } from '@/lib/types';
import { api } from '@/lib/api-client';

type ReturnItemState = ReturnItem & { originalQuantity: number };

export default function NewReturnPage() {
    const router = useRouter();
    const { finalizeSale } = useAppActions(); // Placeholder for return logic
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
            const sales = await api.get<Sale[]>(`sales?invoice=${targetInv}`);
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
                toast.success("Facture trouvée.");
            } else {
                toast.error(`Facture #${targetInv} non trouvée.`);
                setFoundSale(null);
            }
        } catch (error: any) {
            toast.error("Erreur de recherche.");
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
    
    const totalReturnValue = returnItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleSaveReturn = async () => {
        if (!foundSale) return;
        setIsSaving(true);
        try {
            await api.post('returns', {
                originalSaleUuid: foundSale.uuid,
                items: returnItems.filter(item => item.quantity > 0),
                totalReturnValue,
                amountRefunded,
                customerUuid: foundSale.customerUuid,
                notes,
            });
            toast.success("Retour validé.");
            router.push('/returns');
        } catch (error) {
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Retour de Produit" description="Régularisation de stock et solde client.">
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Valider le Retour
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Card className="luxury-glass">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Recherche Facture
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Input
                            placeholder="N° Facture..."
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                            disabled={!!foundSale}
                        />
                        <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)} disabled={!!foundSale}>
                            <Scan className="h-5 w-5" />
                        </Button>
                        <Button onClick={() => handleSearchSale()} disabled={isSearching || !!foundSale}>
                            Rechercher
                        </Button>
                         {foundSale && (
                            <Button variant="ghost" onClick={() => { setFoundSale(null); setInvoiceNumber(''); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <Card className="luxury-glass">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="text-lg">Articles à retourner</CardTitle>
                            <CardDescription>Facture: {foundSale.invoiceNumber}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="p-4 text-left font-black uppercase text-[10px] tracking-widest text-muted-foreground">Produit</th>
                                            <th className="p-4 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Qté Vendue</th>
                                            <th className="p-4 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Qté Retour</th>
                                            <th className="p-4 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground">Remise Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map((item, index) => (
                                            <tr key={index} className="border-b border-white/5">
                                                <td className="p-4 font-bold">{item.productName}</td>
                                                <td className="p-4 text-center font-mono opacity-60">{item.originalQuantity}</td>
                                                <td className="p-4">
                                                    <Input 
                                                        type="number" 
                                                        className="h-8 w-20 mx-auto text-center" 
                                                        value={item.quantity} 
                                                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                                        max={item.originalQuantity}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={item.wasRestocked}
                                                            onCheckedChange={value => handleItemChange(index, 'wasRestocked', value)}
                                                        />
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
                        <Card className="luxury-glass">
                            <CardHeader><CardTitle className="text-sm uppercase tracking-widest">Modalités</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold flex items-center gap-2">
                                        Remboursement Cash
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Montant sorti physiquement de la caisse</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Label>
                                    <Input
                                        type="number"
                                        value={amountRefunded}
                                        onChange={e => setAmountRefunded(Number(e.target.value))}
                                        className="h-12 text-lg font-black"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-destructive/5 border-destructive/20 p-6 flex flex-col justify-center text-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-destructive mb-2">Crédit Client Généré</p>
                            <p className="text-4xl font-black text-destructive">{formatCurrency(totalReturnValue - amountRefunded)}</p>
                            <div className="flex items-center gap-2 justify-center mt-4 text-primary">
                                <HandCoins className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase">Réduction de dette</span>
                            </div>
                        </Card>
                    </div>
                 </div>
            )}

            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleSearchSale} />
        </div>
    );
}

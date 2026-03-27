
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { Sale, ReturnItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Search, Save, Loader2, Scan } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppActions } from '@/stores/appStore';
import { BarcodeScannerDialog } from '@/components/products/BarcodeScannerDialog';

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
                toast.success("Facture trouvée.");
            } else {
                toast.error(`Facture n° ${targetInv} non trouvée.`);
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
        if (!foundSale || totalReturnValue <= 0) return;
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
                toast.success("Retour enregistré.");
                router.push('/returns');
            }
        } catch (error) {
            toast.error("Échec de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader title="Nouveau Retour" description="Régularisation de stock et solde client.">
                <div className="flex gap-2">
                     <Button variant="outline" asChild><Link href="/returns"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Link></Button>
                    {foundSale && (
                        <Button onClick={handleSaveReturn} disabled={isSaving || totalReturnValue <= 0} className="bg-destructive hover:bg-destructive/90">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Valider le Retour
                        </Button>
                    )}
                </div>
            </PageHeader>

            <Card className="luxury-glass">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Search className="h-5 w-5" /> Trouver la facture</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Input placeholder="N° Facture..." value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchSale()} />
                    <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}><Scan className="h-5 w-5" /></Button>
                    <Button onClick={() => handleSearchSale()} disabled={isSearching}>{isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : 'Charger'}</Button>
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-2">
                    <Card className="luxury-glass overflow-hidden">
                        <CardHeader className="bg-primary/5">
                            <CardTitle>Articles de la vente #{foundSale.invoiceNumber}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                             <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr className="border-b">
                                        <th className="p-4 text-left">Produit</th>
                                        <th className="p-4 text-center">Qté Vendue</th>
                                        <th className="p-4 text-center">Qté Retour</th>
                                        <th className="p-4 text-center">Action Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnItems.map((item, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="p-4 font-bold">{item.productName}</td>
                                            <td className="p-4 text-center font-mono opacity-60">{item.originalQuantity}</td>
                                            <td className="p-4">
                                                <Input type="number" className="h-8 w-20 mx-auto text-center" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Switch checked={item.wasRestocked} onCheckedChange={v => handleItemChange(index, 'wasRestocked', v)} />
                                                    <span className="text-[10px] uppercase font-bold">{item.wasRestocked ? 'Remettre en stock' : 'Perte/Défectueux'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card className="luxury-glass">
                            <CardHeader><CardTitle className="text-sm uppercase">Modalités Financières</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Remboursement Cash (DA)</Label>
                                    <Input type="number" value={amountRefunded} onChange={e => setAmountRefunded(Number(e.target.value))} className="h-12 text-xl font-black" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Motif du retour..." />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-destructive/5 border-destructive/20 p-6 flex flex-col justify-center text-center">
                            <p className="text-[10px] uppercase font-black opacity-60">Réduction de dette client</p>
                            <p className="text-4xl font-black text-destructive">{formatCurrency(totalReturnValue - amountRefunded)}</p>
                            <p className="text-xs text-muted-foreground mt-2">Valeur totale: {formatCurrency(totalReturnValue)}</p>
                        </Card>
                    </div>
                 </div>
            )}

            <BarcodeScannerDialog isOpen={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleSearchSale} />
        </div>
    );
}

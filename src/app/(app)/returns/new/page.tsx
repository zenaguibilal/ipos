'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/database';
import { dataService } from '@/services/data-service';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, Search, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sale, ReturnItem } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';

interface ReturnableItem extends ReturnItem {
  maxQuantity: number;
  isNew?: boolean; // For custom items
}

export default function NewReturnPage() {
    const router = useRouter();

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [returnedItems, setReturnedItems] = useState<ReturnableItem[]>([]);
    const [amountRefunded, setAmountRefunded] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleSearchSale = async () => {
        if (!invoiceNumber.trim()) {
            toast.error("Veuillez entrer un numéro de facture.");
            return;
        }
        setIsSearching(true);
        setError(null);
        setFoundSale(null);
        setReturnedItems([]);

        try {
            const sale = await db.sales.where('invoiceNumber').equals(invoiceNumber.trim()).first();
            if (sale) {
                setFoundSale(sale);
                const returnable: ReturnableItem[] = sale.items.map(item => ({
                    productId: item.id as number,
                    productName: item.name,
                    quantity: 0,
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    wasRestocked: true,
                    maxQuantity: item.quantity,
                }));
                setReturnedItems(returnable);
                toast.success(`Vente #${sale.invoiceNumber} trouvée.`);
            } else {
                setError(`Aucune vente trouvée pour le numéro de facture "${invoiceNumber}".`);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Erreur lors de la recherche de la vente.");
        } finally {
            setIsSearching(false);
        }
    };
    
    const handleItemChange = (productId: number | string, field: keyof ReturnableItem, value: any) => {
        setReturnedItems(prev => prev.map(item => {
            if (item.productId === productId) {
                if (field === 'quantity') {
                    const newQty = Math.max(0, Math.min(item.maxQuantity, Number(value) || 0));
                    return { ...item, [field]: newQty };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };
    
    const totalReturnValue = useMemo(() => {
        return returnedItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    }, [returnedItems]);
    
    const handleSaveReturn = async () => {
        if (!foundSale || returnedItems.filter(i => i.quantity > 0).length === 0) {
            toast.error("Veuillez sélectionner au moins un article à retourner.");
            return;
        }
        setIsSaving(true);
        
        try {
            await dataService.recordReturn({
                foundSale,
                returnedItems: returnedItems.filter(i => i.quantity > 0),
                totalReturnValue,
                amountRefunded: Number(amountRefunded) || 0,
                notes
            });
            toast.success("Retour de produit enregistré avec succès !");
            router.push('/returns');
        } catch (e: any) {
            console.error("Failed to save return:", e);
            toast.error(e.message || "Une erreur est survenue lors de l'enregistrement du retour.");
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/returns"><ArrowLeft className="mr-2 h-4 w-4" />Retour à l'historique</Link>
                </Button>
            </div>
            
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Enregistrer un nouveau retour</CardTitle>
                    <CardDescription>Recherchez la facture originale pour commencer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="invoice-search">Numéro de Facture Originale</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="invoice-search" 
                                value={invoiceNumber}
                                onChange={e => setInvoiceNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                                placeholder="INV-123456789"
                            />
                            <Button onClick={handleSearchSale} disabled={isSearching}>
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Rechercher
                            </Button>
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    {foundSale && (
                        <div className="space-y-6 border-t pt-6 animate-in fade-in-50">
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">Détails de la vente</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-semibold">Client:</span> {foundSale.customerName || 'Client de passage'}</div>
                                    <div><span className="font-semibold">Date:</span> {format(safeToDate(foundSale.createdAt!), 'd MMM yyyy, HH:mm', { locale: fr })}</div>
                                    <div><span className="font-semibold">Total:</span> {formatCurrency(foundSale.total)}</div>
                                    <div><span className="font-semibold">Statut:</span> {foundSale.paymentStatus}</div>
                                </CardContent>
                            </Card>
                            
                            <div>
                                <h3 className="font-semibold mb-2">Articles à retourner</h3>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader><TableRow>
                                            <TableHead className="w-[80%]">Produit</TableHead>
                                            <TableHead className="text-center">Qté Achetée</TableHead>
                                            <TableHead className="text-center w-[120px]">Qté à Retourner</TableHead>
                                            <TableHead className="text-center">Remettre en stock ?</TableHead>
                                        </TableRow></TableHeader>
                                        <TableBody>
                                            {returnedItems.map(item => (
                                                <TableRow key={item.productId}>
                                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                                    <TableCell className="text-center">{item.maxQuantity}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Input type="number" value={item.quantity} 
                                                            onChange={(e) => handleItemChange(item.productId, 'quantity', e.target.value)}
                                                            max={item.maxQuantity} min={0} className="h-8 w-20 mx-auto"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                         <Checkbox 
                                                            checked={item.wasRestocked} 
                                                            onCheckedChange={(checked) => handleItemChange(item.productId, 'wasRestocked', checked)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="amount-refunded">Montant remboursé (DA)</Label>
                                        <Input id="amount-refunded" type="number" step="0.1" value={amountRefunded} onChange={e => setAmountRefunded(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes (facultatif)</Label>
                                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>
                                </div>
                                 <div className="p-4 bg-muted rounded-lg flex flex-col items-center justify-center space-y-2">
                                    <p className="text-sm font-medium">VALEUR TOTALE DU RETOUR</p>
                                    <p className="text-3xl font-bold text-destructive">{formatCurrency(totalReturnValue)}</p>
                                    {Number(amountRefunded) > totalReturnValue && (
                                        <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3"/>Le remboursement est supérieur à la valeur.</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={handleSaveReturn} disabled={isSaving || totalReturnValue <= 0}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    Enregistrer le retour
                                </Button>
                            </div>
                        </div>
                    )}
                    
                </CardContent>
            </Card>
        </main>
    );
}

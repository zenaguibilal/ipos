
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, doc, query, where, getDocs, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sale, SaleItem, ReturnItem } from '@/lib/types';
import { cn, safeToDate } from '@/lib/utils';

type ReturnFormItem = SaleItem & { returnQuantity: number };

export default function NewReturnPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [itemsToReturn, setItemsToReturn] = useState<ReturnFormItem[]>([]);
    const [amountRefunded, setAmountRefunded] = useState('');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const salesCollectionRef = useMemoFirebase(() => 
        (user && firestore) ? collection(firestore, 'users', user.uid, 'sales') : null,
    [user, firestore]);

    const searchForSale = useCallback(async (invoiceToSearch: string) => {
        if (!invoiceToSearch.trim() || !salesCollectionRef) return;
        
        setIsSearching(true);
        setFoundSale(null);
        setItemsToReturn([]);

        const q = query(salesCollectionRef, where('invoiceNumber', '==', invoiceToSearch.trim()));
        
        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast.error(`Aucune vente trouvée avec le N° de facture: ${invoiceToSearch}`);
            } else {
                const saleDoc = querySnapshot.docs[0];
                const saleData = { ...saleDoc.data(), id: saleDoc.id } as Sale;
                setFoundSale(saleData);
                setItemsToReturn(saleData.items.map(item => ({ ...item, returnQuantity: 0 })));
                setAmountRefunded('0.0');
                toast.success(`Vente ${saleData.invoiceNumber} trouvée.`);
            }
        } catch (error) {
            console.error("Error searching for sale:", error);
            toast.error("Erreur lors de la recherche de la vente.");
        } finally {
            setIsSearching(false);
        }
    }, [salesCollectionRef]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        searchForSale(invoiceSearch);
    };

    useEffect(() => {
        const invoiceFromQuery = searchParams.get('invoiceNumber');
        if (invoiceFromQuery && salesCollectionRef) {
            setInvoiceSearch(invoiceFromQuery);
            searchForSale(invoiceFromQuery);
        }
    }, [searchParams, searchForSale, salesCollectionRef]);
    
    const handleQuantityChange = (itemId: string, quantity: string) => {
        const numQuantity = parseInt(quantity) || 0;
        setItemsToReturn(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const maxQuantity = item.quantity;
                const newReturnQuantity = Math.max(0, Math.min(numQuantity, maxQuantity));
                return { ...item, returnQuantity: newReturnQuantity };
            }
            return item;
        }));
    };

    const totalReturnValue = useMemo(() => {
        return itemsToReturn.reduce((total, item) => {
            return total + (item.price * item.returnQuantity);
        }, 0);
    }, [itemsToReturn]);

    const handleSaveReturn = async () => {
        if (!foundSale || !user || !firestore) return;
        
        const returnedItems = itemsToReturn.filter(item => item.returnQuantity > 0);
        if (returnedItems.length === 0) {
            toast.error("Veuillez spécifier une quantité à retourner pour au moins un article.");
            return;
        }

        const refundAmount = parseFloat(amountRefunded);
        if (isNaN(refundAmount) || refundAmount < 0) {
            toast.error("Veuillez entrer un montant de remboursement valide.");
            return;
        }

        setIsSaving(true);
        try {
            const newReturnRef = doc(collection(firestore, 'users', user.uid, 'returns'));
            const returnData: Omit<any, 'id' | 'createdAt'> = {
                originalSaleId: foundSale.id,
                originalInvoiceNumber: foundSale.invoiceNumber,
                items: returnedItems.map(item => ({
                    productId: item.id.startsWith('custom-') ? null : item.id,
                    productName: item.name,
                    quantity: item.returnQuantity,
                    price: item.price,
                    purchasePrice: item.purchasePrice
                })),
                totalReturnValue: totalReturnValue,
                amountRefunded: refundAmount,
                customerId: foundSale.customerId,
                customerName: foundSale.customerName,
                createdAt: serverTimestamp(),
                notes: notes,
            };
            
            await setDoc(newReturnRef, returnData);
            
            toast.success("Le retour a été enregistré avec succès.");
            router.push('/returns');

        } catch (error) {
            console.error("Failed to save return:", error);
            toast.error("Une erreur est survenue lors de l'enregistrement du retour.");
        } finally {
            setIsSaving(false);
        }
    };


    if (isUserLoading || !user) {
        return <div className="flex h-full items-center justify-center"><p>Chargement...</p></div>;
    }

    return (
        <main className="flex-1 overflow-auto p-4 sm:p-6">
             <div className="mb-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/returns">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'historique
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Étape 1: Trouver la vente originale</CardTitle>
                        <CardDescription>Entrez le numéro de la facture pour trouver la vente à retourner.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <form onSubmit={handleSearchSubmit} className="flex gap-2">
                            <Input
                                placeholder="Entrez le N° de facture (ex: INV-162...)"
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className="max-w-sm"
                            />
                            <Button type="submit" disabled={isSearching || !invoiceSearch}>
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                                Rechercher
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {foundSale && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Étape 2: Détails du retour</CardTitle>
                            <CardDescription>
                                Vente trouvée pour le client <span className="font-semibold">{foundSale.customerName}</span>, effectuée le <span className="font-semibold">{format(safeToDate(foundSale.createdAt), 'd MMMM yyyy à HH:mm', { locale: fr })}</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div>
                                <Label>Articles à retourner</Label>
                                <div className="mt-2 rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produit</TableHead>
                                                <TableHead className="text-center">Qté Achetée</TableHead>
                                                <TableHead className="text-right">Prix Unitaire</TableHead>
                                                <TableHead className="w-[150px] text-center">Qté à Retourner</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {itemsToReturn.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.name}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{item.price.toFixed(1)} DA</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.returnQuantity}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="h-8 text-center"
                                                            min="0"
                                                            max={item.quantity}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="amount-refunded">Montant remboursé au client (DA)</Label>
                                    <Input
                                        id="amount-refunded"
                                        type="number"
                                        value={amountRefunded}
                                        onChange={(e) => setAmountRefunded(e.target.value)}
                                        step="0.1"
                                        min="0"
                                    />
                                </div>
                                <Card className="p-4 bg-muted">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold">Valeur totale du retour</span>
                                        <span className="text-2xl font-black text-primary">{totalReturnValue.toFixed(1)} DA</span>
                                    </div>
                                </Card>
                            </div>

                             <div>
                                <Label htmlFor="notes">Notes (Optionnel)</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Emballage endommagé, produit défectueux..."
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleSaveReturn} disabled={isSaving || totalReturnValue === 0}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                    Enregistrer le retour
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}

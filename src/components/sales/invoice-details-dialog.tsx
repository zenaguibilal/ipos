'use client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SaleWithDetails, SaleLineItem, Product } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, documentId } from "firebase/firestore";
import { Loader } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Barcode from 'react-barcode';

function InvoiceContent({ sale }: { sale: SaleWithDetails }) {
    const firestore = useFirestore();

    const lineItemsQuery = useMemoFirebase(() => {
        if (!sale?.saleLineItemIds || sale.saleLineItemIds.length === 0) return null;
        // Firestore 'in' query is limited to 30 items. We assume an invoice won't have more.
        return query(collection(firestore, 'sales_line_items'), where(documentId(), 'in', sale.saleLineItemIds.slice(0, 30)));
    }, [firestore, sale?.saleLineItemIds]);

    const { data: lineItems, isLoading: lineItemsLoading } = useCollection<SaleLineItem>(lineItemsQuery);

    const productIds = useMemoFirebase(() => {
        if (!lineItems) return [];
        return lineItems.map(item => item.productId);
    }, [lineItems]);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || productIds.length === 0) return null;
        // Using a collection group query for products might be better if they are nested under different suppliers
        return query(collection(firestore, 'suppliers/supp_1/products'), where(documentId(), 'in', productIds.slice(0, 30)));
    }, [firestore, productIds]);

    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

    const enrichedLineItems = useMemoFirebase(() => {
        if (!lineItems || !products) return [];
        const productMap = new Map(products.map(p => [p.id, p]));
        return lineItems.map(item => ({
            ...item,
            product: productMap.get(item.productId)
        }));
    }, [lineItems, products]);

    const isLoading = lineItemsLoading || productsLoading;
    
    return (
        <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1">
                    <div className="text-sm text-muted-foreground">Facturé à</div>
                    <div className="font-semibold">{sale.customer?.name || 'Client inconnu'}</div>
                </div>
                <div className="grid gap-1 text-right">
                    <div className="text-sm text-muted-foreground">Date de la facture</div>
                    <div className="font-semibold">{format(new Date(sale.saleDate), "d MMMM yyyy", { locale: fr })}</div>
                </div>
            </div>

            <div className="flex justify-center my-4">
              <Barcode value={sale.id} width={1.5} height={50} fontSize={14} />
            </div>
            
            {isLoading ? (
                 <div className="flex justify-center items-center h-40"><Loader className="animate-spin" /></div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-center">Quantité</TableHead>
                            <TableHead className="text-right">Prix Unitaire</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrichedLineItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.product?.name || 'Produit non trouvé'}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{(item.unitPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</TableCell>
                                <TableCell className="text-right">{(item.quantity * item.unitPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className="flex justify-end pt-4">
                <div className="w-full max-w-xs space-y-2">
                     <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{(sale.totalAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</span>
                    </div>
                     <div className="flex justify-between text-sm">
                        <span>Méthode de paiement</span>
                        <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                            {sale.paymentMethod === 'cash' ? 'نقدا' : 'بالدين'}
                        </Badge>
                    </div>
                </div>
            </div>

        </div>
    );
}


export function InvoiceDetailsDialog({ sale, isOpen, onClose }: { sale: SaleWithDetails | null, isOpen: boolean, onClose: () => void }) {

    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Détails de la Facture</DialogTitle>
                    <DialogDescription>
                        Facture #{sale.id.substring(0, 7)}
                    </DialogDescription>
                </DialogHeader>
                <InvoiceContent sale={sale} />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

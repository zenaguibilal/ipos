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
import { collection, query, where, documentId, collectionGroup } from "firebase/firestore";
import { Loader, Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Barcode from 'react-barcode';
import { useMemo, useRef, useState, useEffect } from "react";

function InvoiceContent({ sale, onClose }: { sale: SaleWithDetails; onClose: () => void; }) {
    const firestore = useFirestore();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [storeInfo, setStoreInfo] = useState({ name: '', address: '', phone: '', email: '' });

    useEffect(() => {
        // This code runs on the client, so window is available.
        const info = {
            name: localStorage.getItem('storeName') || 'Votre Magasin',
            address: localStorage.getItem('storeAddress') || 'Votre Adresse',
            phone: localStorage.getItem('storePhone') || '',
            email: localStorage.getItem('storeEmail') || '',
        };
        setStoreInfo(info);
    }, []);

    const lineItemsQuery = useMemoFirebase(() => {
        if (!firestore || !sale?.saleLineItemIds || sale.saleLineItemIds.length === 0) return null;
        return query(collection(firestore, 'sales_line_items'), where(documentId(), 'in', sale.saleLineItemIds.slice(0, 30)));
    }, [firestore, sale?.saleLineItemIds]);

    const { data: lineItems, isLoading: lineItemsLoading } = useCollection<SaleLineItem>(lineItemsQuery);

    const productIds = useMemo(() => {
        if (!lineItems) return [];
        return lineItems.map(item => item.productId);
    }, [lineItems]);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || productIds.length === 0) return null;
        return query(collectionGroup(firestore, 'products'), where(documentId(), 'in', productIds.slice(0, 30)));
    }, [firestore, productIds]);

    const { data: products, isLoading: productsLoading } = useCollection<Product>(productsQuery);

    const enrichedLineItems = useMemo(() => {
        if (!lineItems || !products) return [];
        const productMap = new Map(products.map(p => [p.id, p]));
        return lineItems.map(item => ({
            ...item,
            product: productMap.get(item.productId)
        }));
    }, [lineItems, products]);
    
    const calculatedTotal = useMemo(() => {
        return enrichedLineItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
    }, [enrichedLineItems]);

    const handlePrint = () => {
        const printContent = invoiceRef.current;
        if (printContent) {
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Facture</title>');
                // Simple styling for printing
                printWindow.document.write(`
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; font-family: sans-serif; margin: 20px; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            .text-right { text-align: right; }
                            .font-semibold { font-weight: 600; }
                            .text-muted-foreground { color: #666; }
                            .no-print { display: none !important; }
                            .total-section { float: right; width: 300px; margin-top: 20px;}
                            .header-grid, .customer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                            .text-right { text-align: right; }
                        }
                    </style>
                `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }
        }
    };

    const isLoading = lineItemsLoading || productsLoading;
    
    return (
        <>
            <div ref={invoiceRef} className="space-y-4 printable-content">
                <div className="grid gap-4 md:grid-cols-2 header-grid">
                    <div className="grid gap-2">
                        <h2 className="text-lg font-bold">{storeInfo.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {storeInfo.address}<br/>
                            {storeInfo.phone && `Tél : ${storeInfo.phone}`}<br/>
                            {storeInfo.email && `Email : ${storeInfo.email}`}
                        </p>
                    </div>
                    <div className="grid gap-2 text-right">
                        <div className="text-lg font-bold">FACTURE</div>
                        <div className="text-sm text-muted-foreground">Facture N° {String(sale.invoiceNumber).padStart(6, '0')}</div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 border-t pt-4 mt-4 customer-grid">
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
                    <Barcode value={sale.id} height={50} displayValue={false} />
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
                            <span>{(calculatedTotal / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Méthode de paiement</span>
                            <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                                {sale.paymentMethod === 'cash' ? 'Comptant' : 'Crédit'}
                            </Badge>
                        </div>
                         {sale.paymentMethod === 'credit' && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span>Montant ajouté à la dette</span>
                                <span>{(sale.totalAmount / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 })}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <DialogFooter className="pt-4 no-print">
                <Button variant="outline" onClick={onClose}>Fermer</Button>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
            </DialogFooter>
        </>
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
                        Facture N° {String(sale.invoiceNumber).padStart(6, '0')}
                    </DialogDescription>
                </DialogHeader>
                <InvoiceContent sale={sale} onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
}

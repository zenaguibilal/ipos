'use client';

import { useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import type { Product } from '@/lib/types';

interface ImportProductsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    userId: string;
    existingProducts: Product[];
}

type ProductImportRow = Omit<Product, 'id'> & { id?: string };

export function ImportProductsDialog({ isOpen, onOpenChange, userId, existingProducts }: ImportProductsDialogProps) {
    const firestore = useFirestore();
    const [isLoading, setIsLoading] = useState(false);
    const [parsedData, setParsedData] = useState<ProductImportRow[]>([]);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setIsLoading(false);
        setParsedData([]);
        setFileName('');
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            toast.error("Aucun fichier sélectionné.");
            return;
        }

        if (file.type !== 'text/csv') {
            toast.error("Format de fichier invalide. Veuillez téléverser un fichier CSV.");
            return;
        }
        
        setFileName(file.name);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    toast.error(`Erreurs lors de l'analyse du CSV: ${results.errors.map(e => e.message).join(', ')}`);
                    return;
                }
                const data = results.data.map((row: any) => ({
                    id: row.id,
                    name: row.name || '',
                    price: parseFloat(row.price) || 0,
                    purchasePrice: parseFloat(row.purchasePrice) || 0,
                    quantity: parseInt(row.quantity, 10) || 0,
                    minStockLevel: parseInt(row.minStockLevel, 10) || 0,
                    barcodes: (row.barcodes || '').split(',').map((b: string) => b.trim()).filter(Boolean),
                }));
                setParsedData(data as ProductImportRow[]);
                toast.success(`${data.length} produits prêts à être importés.`);
            },
             error: (error) => {
                toast.error(`Erreur d'analyse CSV : ${error.message}`);
            }
        });
    };

    const handleImport = async () => {
        if (parsedData.length === 0) {
            toast.warning("Aucun produit à importer.");
            return;
        }

        if (!firestore) {
            toast.error("Le service de base de données n'est pas disponible.");
            return;
        }

        setIsLoading(true);
        const batch = writeBatch(firestore);
        const productsRef = collection(firestore, 'users', userId, 'products');

        let updatedCount = 0;
        let createdCount = 0;

        const productMapByName = existingProducts.reduce((acc, p) => {
            acc[p.name.toLowerCase()] = p.id;
            return acc;
        }, {} as Record<string, string>);

        parsedData.forEach(product => {
            const existingIdById = product.id ? existingProducts.find(p => p.id === product.id)?.id : undefined;
            const existingIdByName = productMapByName[product.name.toLowerCase()];
            const docId = existingIdById || existingIdByName;
            
            const productData = {
                name: product.name,
                price: product.price,
                purchasePrice: product.purchasePrice,
                quantity: product.quantity,
                minStockLevel: product.minStockLevel,
                barcodes: product.barcodes,
                createdAt: serverTimestamp(),
            };

            if (docId) { // Update existing product
                const docRef = doc(productsRef, docId);
                batch.set(docRef, productData, { merge: true });
                updatedCount++;
            } else { // Create new product
                const docRef = doc(productsRef);
                batch.set(docRef, productData);
                createdCount++;
            }
        });

        try {
            await batch.commit();
            toast.success(`Importation terminée : ${createdCount} produit(s) créé(s), ${updatedCount} produit(s) mis à jour.`);
            onOpenChange(false);
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'importation des produits.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetState();
        }
        onOpenChange(open);
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Importer des produits depuis un fichier CSV</DialogTitle>
                    <DialogDescription>
                        Le fichier CSV doit contenir les en-têtes : id, name, price, purchasePrice, quantity, minStockLevel, barcodes.
                        L' `id` est optionnel. S'il est fourni et correspond à un produit existant, ce dernier sera mis à jour. Sinon, une correspondance par `name` sera tentée.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="csv-file">Fichier CSV</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
                    </div>
                    {parsedData.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Aperçu de l'importation ({parsedData.length} lignes)</h3>
                            <div className="mt-2 h-64 overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-muted">
                                        <TableRow>
                                            <TableHead>Nom</TableHead>
                                            <TableHead>Prix</TableHead>
                                            <TableHead>Qté</TableHead>
                                            <TableHead>Codes-barres</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.slice(0, 20).map((row, index) => ( // Preview first 20
                                            <TableRow key={index}>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.price}</TableCell>
                                                <TableCell>{row.quantity}</TableCell>
                                                <TableCell>{(row.barcodes || []).join(', ')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {parsedData.length > 20 && <p className="p-2 text-center text-sm text-muted-foreground">...et {parsedData.length - 20} autre(s) ligne(s).</p>}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                        Annuler
                    </Button>
                    <Button onClick={handleImport} disabled={isLoading || parsedData.length === 0}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importation...</> : <><FileUp className="mr-2 h-4 w-4" /> Confirmer l'importation</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

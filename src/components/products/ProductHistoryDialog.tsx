
'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import type { Product, InventoryLog } from '@/lib/types';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface ProductHistoryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
}

const reasonLabels: Record<InventoryLog['reason'], string> = {
    sale: 'Vente',
    return: 'Retour Produit',
    stock_intake: 'Réception de Stock',
    cancellation: 'Annulation Transaction',
    manual_adjustment: 'Ajustement Manuel',
};

export function ProductHistoryDialog({ isOpen, onOpenChange, product }: ProductHistoryDialogProps) {
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && product) {
            setIsLoading(true);
            // Updated to use direct API Wall
            api.get<InventoryLog[]>(`inventory?productUuid=${product.uuid}`)
                .then(setLogs)
                .catch(() => setLogs([]))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, product]);

    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Historique des mouvements : {product.name}
                    </DialogTitle>
                    <DialogDescription>
                        Consultez tous les changements de stock enregistrés pour cet article.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-grow overflow-hidden border rounded-lg mt-4 bg-background/50">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                            <History className="h-12 w-12 mb-4 opacity-20" />
                            <p>Aucun mouvement de stock enregistré pour le moment.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                    <TableRow>
                                        <TableHead>Date & Heure</TableHead>
                                        <TableHead>Type de mouvement</TableHead>
                                        <TableHead className="text-center">Variation</TableHead>
                                        <TableHead className="text-center">Nouveau Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.uuid}>
                                            <TableCell className="text-xs">
                                                {format(new Date(log.createdAt), 'Pp', { locale: fr })}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-sm">
                                                    {reasonLabels[log.reason]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1 font-bold",
                                                    log.change > 0 ? "text-green-500" : "text-destructive"
                                                )}>
                                                    {log.change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {log.change > 0 ? `+${log.change}` : log.change}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-mono font-bold">
                                                {log.newQuantity}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

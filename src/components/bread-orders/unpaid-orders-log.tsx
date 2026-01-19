'use client';

import type { UnpaidBreadOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wallet, Trash2 } from 'lucide-react';
import { safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UnpaidOrdersLogProps {
    unpaidOrders: UnpaidBreadOrder[];
    onClearLog: () => void;
    onDeleteOrder: (order: UnpaidBreadOrder) => void;
    isLoading: boolean;
}

export function UnpaidOrdersLog({ unpaidOrders, onClearLog, onDeleteOrder, isLoading }: UnpaidOrdersLogProps) {
    const totalDebt = unpaidOrders.reduce((sum, order) => sum + order.totalOwed, 0);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Journal des dettes de pain
                </CardTitle>
                <CardDescription>
                    Historique des commandes de pain non payées après réinitialisation.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-4">
                {unpaidOrders.length > 0 && (
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                        <span className="font-semibold">Total des dettes archivées:</span>
                        <span className="font-bold text-lg text-destructive">{totalDebt.toFixed(1)} DA</span>
                    </div>
                )}
                <ScrollArea className="flex-grow h-64">
                    {isLoading ? (
                        <p>Chargement du journal...</p>
                    ) : unpaidOrders.length === 0 ? (
                        <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                            Aucune dette archivée.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {unpaidOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.name}</TableCell>
                                        <TableCell>{order.totalOwed.toFixed(1)} DA</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">
                                            {order.archivedAt ? format(safeToDate(order.archivedAt), 'd MMM', { locale: fr }) : '...'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteOrder(order)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ScrollArea>
                {unpaidOrders.length > 0 && (
                    <Button variant="outline" size="sm" onClick={onClearLog} className="mt-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Effacer le journal
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

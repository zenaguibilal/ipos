'use client';

import type { StockIntake, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';

interface StockIntakeTableProps {
    intakes: StockIntake[];
    supplierMap: Map<string, Supplier>;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

export function StockIntakeTable({ intakes, supplierMap, onViewDetails, onCancelIntake }: StockIntakeTableProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-center">Articles</TableHead>
                        <TableHead className="text-right">Valeur Totale</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {intakes.map(intake => {
                        const supplierName = intake.supplierUuid ? supplierMap.get(intake.supplierUuid)?.name : 'Fournisseur inconnu';
                        return (
                            <TableRow key={intake.uuid}>
                                <TableCell className="font-medium">{supplierName}</TableCell>
                                <TableCell>{intake.invoiceNumber || 'N/A'}</TableCell>
                                <TableCell>{format(safeToDate(intake.createdAt!), 'd MMM yyyy', { locale: fr })}</TableCell>
                                <TableCell className="text-center">{intake.items.length}</TableCell>
                                <TableCell className="text-right font-semibold text-primary">{formatCurrency(intake.totalValue)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onViewDetails(intake)}>
                                                <FileText className="mr-2 h-4 w-4" /> Voir les détails
                                            </DropdownMenuItem>
                                            {isManagerOrAdmin && (
                                                <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Annuler la réception
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

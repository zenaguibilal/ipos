'use client';

import type { StockIntake, Supplier } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Calendar, Truck, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';

interface StockIntakeTableProps {
    intakes: StockIntake[];
    supplierMap: Map<string, Supplier>;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
}

export function StockIntakeTable({ intakes, supplierMap, onViewDetails, onCancelIntake }: StockIntakeTableProps) {
    const isManagerOrAdmin = useIsManagerOrAdmin();

    return (
        <div className="rounded-2xl border border-white/5 bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground px-6 py-5">Identité Partenaire</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">N° Référence</TableHead>
                        <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date Réception</TableHead>
                        <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Items</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Logistique</TableHead>
                        <TableHead className="text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Valeur Stock</TableHead>
                        <TableHead className="w-[80px] text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground px-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {intakes.map(intake => {
                        const supplierName = intake.supplierUuid ? supplierMap.get(intake.supplierUuid)?.name : 'Fournisseur inconnu';
                        return (
                            <TableRow key={intake.uuid} className="hover:bg-primary/5 transition-colors border-white/5 group">
                                <TableCell className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center font-black text-xs text-primary shadow-inner">
                                            {supplierName?.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{supplierName}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                                    {intake.invoiceNumber || 'SANS_REF'}
                                </TableCell>
                                <TableCell className="text-[11px] font-medium opacity-70">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-primary/40" />
                                        {format(safeToDate(intake.invoiceDate), 'dd/MM/yyyy', { locale: fr })}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="font-black h-5 text-[9px] px-2 rounded-lg bg-muted/50 border-white/5">
                                        {intake.items.length}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className={cn("text-[11px] font-black", intake.transportFees > 0 ? "text-orange-400" : "text-muted-foreground opacity-30")}>
                                        {intake.transportFees > 0 ? formatCurrency(intake.transportFees) : '-'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-black text-sm text-primary">{formatCurrency(intake.totalValue)}</span>
                                </TableCell>
                                <TableCell className="text-right px-6">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-all">
                                                <MoreHorizontal className="h-4.5 w-4.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="luxury-glass">
                                            <DropdownMenuItem onClick={() => onViewDetails(intake)} className="gap-2 font-bold">
                                                <FileText className="h-4 w-4" /> Détails Complets
                                            </DropdownMenuItem>
                                            {isManagerOrAdmin && (
                                                <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 font-bold">
                                                    <Trash2 className="h-4 w-4" /> Annuler Réception
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

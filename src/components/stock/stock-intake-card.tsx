
'use client';

import React from 'react';
import type { StockIntake } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Trash2, Calendar, Truck, User, Hash, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeToDate, formatCurrency, cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import { Checkbox } from '@/components/ui/checkbox';

interface StockIntakeCardProps {
    intake: StockIntake;
    supplierName?: string;
    onViewDetails: (intake: StockIntake) => void;
    onCancelIntake: (intake: StockIntake) => void;
    isSelected: boolean;
    onToggleSelection: () => void;
}

export const StockIntakeCard = React.memo<StockIntakeCardProps>(({ 
    intake, 
    supplierName, 
    onViewDetails, 
    onCancelIntake,
    isSelected,
    onToggleSelection
}) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    const name = supplierName || 'Fournisseur inconnu';

    return (
        <Card className={cn(
            "luxury-glass border-white/5 bg-muted/10 transition-all duration-500 hover:shadow-2xl hover:border-primary/20 group relative overflow-hidden",
            isSelected && "ring-2 ring-primary border-primary/50 bg-primary/5 shadow-primary/10"
        )}>
            <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Truck className="h-32 w-32 rotate-12" />
            </div>

            <CardHeader className="pb-3 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} className="mt-1" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-primary opacity-60" />
                                <CardTitle className="text-sm font-black uppercase tracking-tight truncate max-w-[180px]">{name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-muted-foreground opacity-60">
                                <Hash className="h-2.5 w-2.5" />
                                {intake.invoiceNumber || 'SANS_REF'}
                            </div>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="luxury-glass">
                            <DropdownMenuItem onClick={() => onViewDetails(intake)} className="gap-2 font-bold">
                                <FileText className="h-4 w-4" /> Détails du Bon
                            </DropdownMenuItem>
                            {isManagerOrAdmin && (
                                <DropdownMenuItem onClick={() => onCancelIntake(intake)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 font-bold">
                                    <Trash2 className="h-4 w-4" /> Annuler Réception
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4" onClick={onToggleSelection} style={{ cursor: 'pointer' }}>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Date Flux</p>
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <Calendar className="h-3.5 w-3.5 text-primary/60" />
                            {format(safeToDate(intake.invoiceDate), 'd MMM yyyy', { locale: fr })}
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Volume Articles</p>
                        <p className="text-xs font-black">{intake.items.length} références</p>
                    </div>
                </div>

                {intake.transportFees > 0 && (
                    <div className="p-2.5 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">Logistique</span>
                        <span className="text-[10px] font-black text-orange-400">+{formatCurrency(intake.transportFees)}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="bg-primary/5 p-4 border-t border-white/5 mt-auto relative z-10" onClick={() => onViewDetails(intake)} style={{ cursor: 'pointer' }}>
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground opacity-40" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">Enregistré le {format(safeToDate(intake.createdAt!), 'dd/MM')}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-black text-primary">{formatCurrency(intake.totalValue)}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
});
StockIntakeCard.displayName = 'StockIntakeCard';

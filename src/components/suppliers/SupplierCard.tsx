
'use client';

import React from 'react';
import type { Supplier } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Phone, MapPin, User, Wallet, ArrowRight, Eye } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsManagerOrAdmin } from '@/stores/appStore';
import Link from 'next/link';

interface SupplierCardProps {
    supplier: Supplier;
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

export const SupplierCard = React.memo(({ supplier, onEdit, onDelete }: SupplierCardProps) => {
    const isManagerOrAdmin = useIsManagerOrAdmin();
    
    return (
        <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 luxury-glass border-primary/5 group relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Wallet className="h-32 w-32 rotate-12 text-primary" />
            </div>

            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <Link href={`/suppliers/${supplier.uuid}`} className="flex items-center gap-3 group/link">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl shadow-inner group-hover/link:bg-primary group-hover/link:text-primary-foreground transition-colors">
                            {supplier.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                            <CardTitle className="text-lg font-bold leading-tight group-hover/link:text-primary transition-colors">
                                {supplier.name}
                            </CardTitle>
                            {supplier.contactPerson && (
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter flex items-center gap-1">
                                    <User className="h-2.5 w-2.5" />
                                    {supplier.contactPerson}
                                </p>
                            )}
                        </div>
                    </Link>
                    {isManagerOrAdmin && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="luxury-glass">
                                <DropdownMenuItem asChild>
                                    <Link href={`/suppliers/${supplier.uuid}`} className="gap-2">
                                        <Eye className="h-4 w-4" /> Détails & Activité
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(supplier)} className="gap-2">
                                    <Edit className="h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(supplier)} className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2">
                                    <Trash2 className="h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                <div className="space-y-2">
                    {supplier.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${supplier.phone}`} className="font-medium">{supplier.phone}</a>
                        </div>
                    )}
                    {supplier.address && (
                        <div className="flex items-center gap-2 text-muted-foreground italic">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{supplier.address}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className={cn(
                "p-4 border-t mt-auto relative z-10",
                supplier.balance > 0 ? "bg-destructive/5 border-destructive/10" : "bg-primary/5 border-primary/10"
            )}>
                 <div className="flex justify-between items-center w-full">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Solde dû</span>
                        <span className={cn(
                            "text-xl font-black",
                            supplier.balance > 0 ? "text-destructive" : "text-chart-quaternary"
                        )}>
                            {formatCurrency(supplier.balance)}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10">
                        <Link href={`/suppliers/${supplier.uuid}`}>
                            <ArrowRight className="h-5 w-5 text-primary" />
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
});
SupplierCard.displayName = 'SupplierCard';

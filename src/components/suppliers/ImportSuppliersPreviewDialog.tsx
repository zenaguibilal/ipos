
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Building, UserCheck, AlertTriangle, CheckCircle, Trash2, Search } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

interface ImportSuppliersPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    analysis: any;
    onConfirm: (confirmedData: { toAdd: any[], toUpdate: any[] }) => void;
    isImporting: boolean;
}

export function ImportSuppliersPreviewDialog({ isOpen, onOpenChange, analysis, onConfirm, isImporting }: ImportSuppliersPreviewDialogProps) {
    const [editableItems, setEditableItems] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (analysis) {
            const items = [
                ...analysis.toAdd.map((s: any, i: number) => ({ key: `new-${i}`, include: true, status: 'new', data: s })),
                ...analysis.toUpdate.map((s: any, i: number) => ({ key: `update-${i}`, include: true, status: 'update', data: s })),
                ...analysis.errors.map((s: any, i: number) => ({ key: `error-${i}`, include: false, status: 'error', data: s }))
            ];
            setEditableItems(items);
        }
    }, [analysis]);

    const handleToggleInclude = (key: string) => {
        setEditableItems(prev => prev.map(item => item.key === key ? { ...item, include: !item.include } : item));
    };

    const handleItemChange = (key: string, field: string, value: string) => {
        setEditableItems(prev => prev.map(item => item.key === key ? { ...item, data: { ...item.data, [field]: value } } : item));
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return editableItems;
        return editableItems.filter(item => item.data.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [editableItems, searchQuery]);

    const stats = useMemo(() => ({
        toAdd: editableItems.filter(i => i.include && i.status === 'new').length,
        toUpdate: editableItems.filter(i => i.include && i.status === 'update').length,
        errors: editableItems.filter(i => i.status === 'error').length,
    }), [editableItems]);

    const handleConfirm = () => {
        onConfirm({
            toAdd: editableItems.filter(i => i.include && i.status === 'new').map(i => i.data),
            toUpdate: editableItems.filter(i => i.include && i.status === 'update').map(i => i.data),
        });
    };

    if (!analysis) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col luxury-glass">
                <DialogHeader>
                    <DialogTitle>Aperçu de l'importation</DialogTitle>
                    <DialogDescription>Vérifiez les données des fournisseurs avant l'intégration finale.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-center">
                        <Building className="h-5 w-5 text-primary mx-auto mb-1" />
                        <p className="text-xl font-black">{stats.toAdd}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Nouveaux</p>
                    </div>
                    <div className="p-3 bg-chart-quaternary/10 rounded-xl border border-chart-quaternary/20 text-center">
                        <UserCheck className="h-5 w-5 text-chart-quaternary mx-auto mb-1" />
                        <p className="text-xl font-black">{stats.toUpdate}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Mises à jour</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20 text-center">
                        <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-1" />
                        <p className="text-xl font-black">{stats.errors}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Erreurs</p>
                    </div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher par nom..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>

                <ScrollArea className="flex-grow border rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Nom du Fournisseur</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map(item => (
                                <TableRow key={item.key} className={!item.include ? 'opacity-50 grayscale' : ''}>
                                    <TableCell>
                                        <Checkbox checked={item.include} onCheckedChange={() => handleToggleInclude(item.key)} disabled={item.status === 'error'} />
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.data.name} onChange={e => handleItemChange(item.key, 'name', e.target.value)} className="h-8 text-xs font-bold" />
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.data.contactPerson || ''} onChange={e => handleItemChange(item.key, 'contactPerson', e.target.value)} className="h-8 text-xs" />
                                    </TableCell>
                                    <TableCell>
                                        <Input value={item.data.phone || ''} onChange={e => handleItemChange(item.key, 'phone', e.target.value)} className="h-8 text-xs font-mono" />
                                    </TableCell>
                                    <TableCell>
                                        {item.status === 'new' && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase">Nouveau</Badge>}
                                        {item.status === 'update' && <Badge variant="secondary" className="bg-chart-quaternary/10 text-chart-quaternary border-chart-quaternary/20 text-[9px] uppercase">Mise à jour</Badge>}
                                        {item.status === 'error' && <Badge variant="destructive" className="text-[9px] uppercase">{item.data.error}</Badge>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <DialogFooter className="pt-4 mt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleConfirm} disabled={isImporting || (stats.toAdd + stats.toUpdate === 0)} className="bg-primary hover:bg-primary/90 px-8">
                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Finaliser l'importation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

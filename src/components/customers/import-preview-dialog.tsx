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
import { Loader2, UserPlus, UserCheck, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
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

export interface ImportAnalysis {
    customersToAdd: any[];
    customersToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

type EditableImportItem = {
    key: string;
    include: boolean;
    status: 'new' | 'update';
    data: any;
};

interface ImportPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    analysis: ImportAnalysis | null;
    onConfirm: (confirmedAnalysis: ImportAnalysis) => void;
    isImporting: boolean;
}

export function ImportPreviewDialog({ isOpen, onOpenChange, analysis, onConfirm, isImporting }: ImportPreviewDialogProps) {
    
    const [editableItems, setEditableItems] = useState<EditableImportItem[]>([]);

    useEffect(() => {
        if (analysis) {
            const toAdd = analysis.customersToAdd.map((c, i) => ({
                key: `new-${i}`,
                include: true,
                status: 'new' as const,
                data: c,
            }));
            const toUpdate = analysis.customersToUpdate.map((c, i) => ({
                key: `update-${i}`,
                include: true,
                status: 'update' as const,
                data: c,
            }));
            setEditableItems([...toAdd, ...toUpdate]);
        }
    }, [analysis, isOpen]);

    const handleItemChange = (key: string, field: string, value: string | number | null) => {
        setEditableItems(prev => prev.map(item => 
            item.key === key ? { ...item, data: { ...item.data, [field]: value } } : item
        ));
    };

    const handleToggleInclude = (key: string) => {
        setEditableItems(prev => prev.map(item => 
            item.key === key ? { ...item, include: !item.include } : item
        ));
    };

    const handleRemoveItem = (key: string) => {
        setEditableItems(prev => prev.filter(item => item.key !== key));
    };

    const handleConfirmImport = () => {
        if (!analysis) return;

        const confirmedAnalysis: ImportAnalysis = {
            ...analysis,
            customersToAdd: editableItems.filter(i => i.include && i.status === 'new').map(i => i.data),
            customersToUpdate: editableItems.filter(i => i.include && i.status === 'update').map(i => i.data),
        };
        onConfirm(confirmedAnalysis);
    };

    const stats = useMemo(() => {
        if (!analysis) return { toAdd: 0, toUpdate: 0, skipped: 0, errors: 0 };
        return {
            toAdd: editableItems.filter(i => i.include && i.status === 'new').length,
            toUpdate: editableItems.filter(i => i.include && i.status === 'update').length,
            skipped: analysis.skippedRows.length + editableItems.filter(i => !i.include).length,
            errors: analysis.errorRows.length,
        };
    }, [editableItems, analysis]);

    if (!analysis) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Aperçu et modification de l'importation</DialogTitle>
                    <DialogDescription>
                        Vérifiez, modifiez ou excluez des lignes avant de finaliser l'importation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <UserPlus className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <p className="text-xl font-bold mt-1">{stats.toAdd}</p>
                            <p className="text-xs text-muted-foreground">Nouveaux clients</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <UserCheck className="mx-auto h-6 w-6 text-green-600 dark:text-green-400" />
                            <p className="text-xl font-bold mt-1">{stats.toUpdate}</p>
                            <p className="text-xs text-muted-foreground">Clients à M.A.J.</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <CheckCircle className="mx-auto h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-xl font-bold mt-1">{stats.skipped}</p>
                            <p className="text-xs text-muted-foreground">Lignes ignorées</p>
                        </div>
                         <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertTriangle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
                            <p className="text-xl font-bold mt-1">{stats.errors}</p>
                            <p className="text-xs text-muted-foreground">Lignes en erreur</p>
                        </div>
                    </div>
                    
                    <ScrollArea className="border rounded-lg h-[40vh]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    <TableHead className="w-12"><Checkbox 
                                        checked={editableItems.length > 0 && editableItems.every(i => i.include)}
                                        onCheckedChange={(checked) => {
                                            setEditableItems(prev => prev.map(item => ({ ...item, include: !!checked })))
                                        }}
                                    /></TableHead>
                                    <TableHead>Prénom</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead>Dette (DA)</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {editableItems.length > 0 ? editableItems.map((item) => (
                                    <TableRow key={item.key} className={!item.include ? 'bg-muted/50 text-muted-foreground' : ''}>
                                        <TableCell>
                                            <Checkbox checked={item.include} onCheckedChange={() => handleToggleInclude(item.key)} />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.data.firstName} onChange={e => handleItemChange(item.key, 'firstName', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.data.lastName} onChange={e => handleItemChange(item.key, 'lastName', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={item.data.phone || ''} onChange={e => handleItemChange(item.key, 'phone', e.target.value)} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.data.debtAmount !== null && item.data.debtAmount !== undefined ? item.data.debtAmount : ''} onChange={e => handleItemChange(item.key, 'debtAmount', e.target.value === '' ? null : parseFloat(e.target.value))} className="h-8" disabled={!item.include} />
                                        </TableCell>
                                        <TableCell>
                                            {item.status === 'new' && <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">Nouveau</Badge>}
                                            {item.status === 'update' && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Mise à jour</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.key)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Aucune donnée à importer.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                    { analysis.errorRows.length > 0 && (
                        <div className="pt-2">
                             <h4 className="font-semibold text-destructive">Lignes avec Erreurs (ignorées)</h4>
                             <p className="text-xs text-muted-foreground">Ces lignes ont été ignorées car le nom est manquant.</p>
                             <ScrollArea className="border rounded-lg h-24 mt-2">
                                <pre className="p-2 text-xs">{JSON.stringify(analysis.errorRows, null, 2)}</pre>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirmImport} disabled={isImporting || editableItems.filter(i => i.include).length === 0}>
                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isImporting ? 'Importation...' : `Confirmer et Importer ${stats.toAdd + stats.toUpdate} client(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

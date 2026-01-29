
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';

export interface ImportAnalysis {
    customersToAdd: any[];
    customersToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

interface ImportPreviewDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    analysis: ImportAnalysis | null;
    onConfirm: () => void;
    isImporting: boolean;
}

export function ImportPreviewDialog({ isOpen, onOpenChange, analysis, onConfirm, isImporting }: ImportPreviewDialogProps) {
    if (!analysis) return null;

    const { customersToAdd, customersToUpdate, skippedRows, errorRows } = analysis;

    const previewItems = [
        ...customersToAdd.slice(0, 2).map(c => ({ ...c, status: 'new' })),
        ...customersToUpdate.slice(0, 2).map(c => ({ ...c, status: 'update' })),
        ...skippedRows.slice(0, 1).map(r => ({ ...r, status: 'skip' })),
    ].slice(0, 5);


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Aperçu de l'importation</DialogTitle>
                    <DialogDescription>
                        Vérifiez les données avant de finaliser l'importation. Seules les premières lignes sont affichées à titre d'exemple.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <UserPlus className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <p className="text-xl font-bold mt-1">{customersToAdd.length}</p>
                            <p className="text-xs text-muted-foreground">Nouveaux clients</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <UserCheck className="mx-auto h-6 w-6 text-green-600 dark:text-green-400" />
                            <p className="text-xl font-bold mt-1">{customersToUpdate.length}</p>
                            <p className="text-xs text-muted-foreground">Clients à mettre à jour</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <CheckCircle className="mx-auto h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-xl font-bold mt-1">{skippedRows.length}</p>
                            <p className="text-xs text-muted-foreground">Lignes ignorées</p>
                        </div>
                         <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertTriangle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
                            <p className="text-xl font-bold mt-1">{errorRows.length}</p>
                            <p className="text-xs text-muted-foreground">Lignes en erreur</p>
                        </div>
                    </div>

                    <h4 className="font-semibold pt-4">Exemples de données :</h4>
                     <div className="border rounded-lg max-h-60 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Téléphone</TableHead>
                                    <TableHead>Dette (DA)</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {previewItems.length > 0 ? previewItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.firstName} {item.lastName}</TableCell>
                                        <TableCell>{item.phone || 'N/A'}</TableCell>
                                        <TableCell>{item.debtAmount !== null ? item.debtAmount?.toFixed(2) : 'N/A'}</TableCell>
                                        <TableCell>
                                            {item.status === 'new' && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Nouveau</Badge>}
                                            {item.status === 'update' && <Badge variant="secondary" className="bg-green-100 text-green-800">Mise à jour</Badge>}
                                            {item.status === 'skip' && <Badge variant="outline">Ignoré</Badge>}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">Aucune donnée à importer.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Annuler
                    </Button>
                    <Button onClick={onConfirm} disabled={isImporting || (customersToAdd.length === 0 && customersToUpdate.length === 0)}>
                        {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isImporting ? 'Importation...' : `Confirmer et Importer ${customersToAdd.length + customersToUpdate.length} client(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

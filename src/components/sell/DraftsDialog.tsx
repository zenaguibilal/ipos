'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import type { Draft } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { dataService } from '@/services/data-service';
import { Download, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DraftsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onLoadDraft: (draftId: number) => void;
}

export function DraftsDialog({ isOpen, onOpenChange, onLoadDraft }: DraftsDialogProps) {
    const [drafts, setDrafts] = useState<Draft[]>([]);

    const loadDrafts = useCallback(async () => {
        if(isOpen) {
            setDrafts(await dataService.getDrafts());
        }
    }, [isOpen]);

    useEffect(() => {
        loadDrafts();
    }, [loadDrafts]);

    const handleDelete = async (id: number) => {
        await dataService.deleteDraft(id);
        setDrafts(prev => prev.filter(d => d.id !== id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Brouillons de Vente</DialogTitle>
                    <DialogDescription>
                        Chargez un brouillon pour continuer une vente ou supprimez-le.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto my-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {drafts && drafts.length > 0 ? drafts.map((draft) => (
                                <TableRow key={draft.id}>
                                    <TableCell>{format(new Date(draft.date), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                                    <TableCell>{draft.customerName || 'Client de passage'}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(draft.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => onLoadDraft(draft.id!)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Cette action est irréversible.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(draft.id!)} className="bg-destructive hover:bg-destructive/90">
                                                        Supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Aucun brouillon trouvé.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

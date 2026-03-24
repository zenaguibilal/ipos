'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import type { Draft } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { draftService } from '@/services';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';

interface DraftsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLoadDraft: (draftId: number) => void;
}

export function DraftsDialog({ isOpen, onOpenChange, onLoadDraft }: DraftsDialogProps) {
    const drafts = useLiveQuery(() => db.drafts.orderBy('createdAt').reverse().toArray());
    const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);

    const handleLoad = (draftId: number) => {
        onLoadDraft(draftId);
        onOpenChange(false);
    };
    
    const handleDelete = async () => {
        if (!draftToDelete?.id) return;
        try {
            await draftService.deleteDraft(draftToDelete.id);
            toast.success("Brouillon supprimé.");
        } catch (error) {
            toast.error("Erreur lors de la suppression du brouillon.");
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ouvrir un brouillon</DialogTitle>
                        <DialogDescription>
                            Sélectionnez un brouillon pour le charger dans le panier actif.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                        <div className="space-y-2 py-4">
                            {drafts?.length === 0 && <p className="text-center text-muted-foreground">Aucun brouillon enregistré.</p>}
                            {drafts?.map(draft => (
                                <div key={draft.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{draft.customerName || "Client de passage"}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(draft.date, "d MMM yyyy, HH:mm", { locale: fr })} - {draft.items.length} article(s)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(draft.total)}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleLoad(draft.id!)}>Charger</Button>
                                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setDraftToDelete(draft)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <ConfirmAlertDialog
                isOpen={!!draftToDelete}
                onOpenChange={() => setDraftToDelete(null)}
                title="Supprimer le brouillon ?"
                description="Cette action est irréversible."
                onConfirm={handleDelete}
                confirmText="Oui, supprimer"
            />
        </>
    );
}

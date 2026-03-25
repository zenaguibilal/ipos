'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { BreadClient } from '@/lib/types';
import { Loader2, Trash2 } from 'lucide-react';
import { breadService } from '@/services/bread.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { BREAD_WEEK_DAY_LABELS_FULL } from '@/lib/constants';

const initialFormState: Omit<BreadClient, 'id' | 'createdAt' | 'updatedAt'> = {
    nom: '',
    actif: true,
    type_recurrence: 'quotidien',
    quantite_defaut: 10,
    jours_semaine: {
        lundi:    { actif: true, quantite: 10 },
        mardi:    { actif: true, quantite: 10 },
        mercredi: { actif: true, quantite: 10 },
        jeudi:    { actif: true, quantite: 10 },
        vendredi: { actif: false, quantite: 0 },
        samedi:   { actif: true, quantite: 10 },
        dimanche: { actif: true, quantite: 10 }
    }
};

interface BreadClientFormProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    client: BreadClient | null;
}

export function BreadClientForm({ isOpen, onOpenChange, client }: BreadClientFormProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

    useEffect(() => {
        if (client && isOpen) {
            setFormState({
                nom: client.nom,
                actif: client.actif,
                type_recurrence: client.type_recurrence,
                quantite_defaut: client.quantite_defaut || 10,
                jours_semaine: client.jours_semaine || initialFormState.jours_semaine!
            });
        } else {
            setFormState(initialFormState);
        }
    }, [client, isOpen]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.nom) {
            toast.error("Le nom du client est requis.");
            return;
        }
        setIsLoading(true);
        try {
            const dataToSave: Partial<BreadClient> = {
                nom: formState.nom,
                actif: formState.actif,
                type_recurrence: formState.type_recurrence,
            };
            if (formState.type_recurrence === 'quotidien') {
                dataToSave.quantite_defaut = formState.quantite_defaut;
            } else if (formState.type_recurrence === 'jours_specifiques') {
                dataToSave.jours_semaine = formState.jours_semaine;
            }

            if (client && client.id) {
                await breadService.updateBreadClient(client.id, dataToSave);
                toast.success(`Client "${formState.nom}" mis à jour.`);
            } else {
                await breadService.addBreadClient(dataToSave as BreadClient);
                toast.success(`Client "${formState.nom}" ajouté.`);
            }
            onOpenChange(false);
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    }, [formState, client, onOpenChange]);

    const handleDelete = useCallback(async () => {
        if (!client || !client.id) return;
        setIsLoading(true);
        try {
            await breadService.deleteBreadClient(client.id);
            toast.success(`Client "${client.nom}" supprimé.`);
            onOpenChange(false);
        } catch (error) {
            toast.error("Erreur lors de la suppression du client.");
        } finally {
            setIsLoading(false);
            setDeleteAlertOpen(false);
        }
    }, [client, onOpenChange]);
    
    const handleDayToggle = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL) => {
        setFormState(prev => ({
            ...prev,
            jours_semaine: {
                ...prev.jours_semaine!,
                [day]: { ...prev.jours_semaine![day], actif: !prev.jours_semaine![day].actif }
            }
        }));
    };

    const handleDayQuantityChange = (day: keyof typeof BREAD_WEEK_DAY_LABELS_FULL, value: string) => {
         const quantite = parseInt(value, 10) || 0;
         setFormState(prev => ({
            ...prev,
            jours_semaine: {
                ...prev.jours_semaine!,
                [day]: { ...prev.jours_semaine![day], quantite }
            }
        }));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{client ? 'Modifier le client' : 'Ajouter un client de pain'}</DialogTitle>
                            <DialogDescription>
                                Gérez les informations et les commandes récurrentes du client.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="actif" className="text-base">Client Actif</Label>
                                <Switch id="actif" checked={formState.actif} onCheckedChange={(checked) => setFormState(s => ({ ...s, actif: checked }))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nom">Nom du Client</Label>
                                <Input id="nom" value={formState.nom} onChange={(e) => setFormState(s => ({ ...s, nom: e.target.value }))} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type_recurrence">Type de Récurence</Label>
                                <Select value={formState.type_recurrence} onValueChange={(value) => setFormState(s => ({ ...s, type_recurrence: value as any }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quotidien">Quotidien</SelectItem>
                                        <SelectItem value="jours_specifiques">Jours Spécifiques</SelectItem>
                                        <SelectItem value="aucun">Manuel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formState.type_recurrence === 'quotidien' && (
                                <div className="space-y-2">
                                    <Label htmlFor="quantite_defaut">Quantité par défaut</Label>
                                    <Input id="quantite_defaut" type="number" value={formState.quantite_defaut} onChange={(e) => setFormState(s => ({ ...s, quantite_defaut: parseInt(e.target.value) || 0 }))} />
                                </div>
                            )}
                            {formState.type_recurrence === 'jours_specifiques' && (
                                <div className="space-y-3">
                                    <Label>Quantités par jour</Label>
                                    <div className="space-y-2 rounded-md border p-4">
                                        {Object.entries(BREAD_WEEK_DAY_LABELS_FULL).map(([key, label]) => (
                                            <div key={key} className="flex items-center justify-between gap-4">
                                                <Switch id={key} checked={formState.jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif} onCheckedChange={() => handleDayToggle(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL)} />
                                                <Label htmlFor={key} className="flex-grow">{label}</Label>
                                                <Input type="number" className="w-24" 
                                                    value={formState.jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].quantite}
                                                    onChange={e => handleDayQuantityChange(key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL, e.target.value)}
                                                    disabled={!formState.jours_semaine![key as keyof typeof BREAD_WEEK_DAY_LABELS_FULL].actif}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            {client && (
                                <Button type="button" variant="destructive" onClick={() => setDeleteAlertOpen(true)} disabled={isLoading}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </Button>
                            )}
                            <div className="flex-grow" />
                            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ConfirmAlertDialog
                isOpen={isDeleteAlertOpen}
                onOpenChange={setDeleteAlertOpen}
                title={`Supprimer le client "${client?.nom}" ?`}
                description="Cette action est irréversible et supprimera le client et toutes ses commandes de pain."
                onConfirm={handleDelete}
                confirmText="Oui, supprimer"
            />
        </>
    );
}

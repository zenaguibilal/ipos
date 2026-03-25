'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { backupService } from "@/services/backup.service";
import type { FileObject } from '@supabase/storage-js';
import { Loader2, Download, Upload, Trash2, AlertTriangle, FileClock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';

export function DataManagementCard() {
    const [backups, setBackups] = useState<FileObject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedBackupPath, setSelectedBackupPath] = useState<string | null>(null);

    const fetchBackups = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await backupService.listBackups();
            setBackups(data);
        } catch (error: any) {
            toast.error("Impossible de charger la liste des sauvegardes.", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            await backupService.createBackup();
            toast.success("Sauvegarde créée avec succès.");
            fetchBackups();
        } catch (error: any) {
            toast.error("Erreur lors de la création de la sauvegarde.", { description: error.message });
        } finally {
            setIsCreating(false);
        }
    };

    const handleRestoreClick = (path: string) => {
        setSelectedBackupPath(path);
        setIsRestoreConfirmOpen(true);
    };

    const handleConfirmRestore = async () => {
        if (!selectedBackupPath) return;
        setIsRestoring(selectedBackupPath);
        const promise = backupService.restoreBackup(selectedBackupPath);
        toast.promise(promise, {
            loading: 'Restauration en cours... Veuillez ne pas fermer cette page.',
            success: () => {
                setIsRestoring(null);
                return 'Restauration terminée avec succès. L\'application va se recharger.';
            },
            error: (err) => {
                setIsRestoring(null);
                return `Échec de la restauration: ${err.message}`;
            },
        });
        
        promise.then(() => {
            setTimeout(() => window.location.reload(), 2000);
        });
    };
    
    const handleDeleteClick = (path: string) => {
        setSelectedBackupPath(path);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedBackupPath) return;
        setIsDeleting(selectedBackupPath);
        try {
            await backupService.deleteBackup(selectedBackupPath);
            toast.success("Sauvegarde supprimée.");
            setBackups(backups.filter(b => b.name !== selectedBackupPath?.split('/').pop()));
        } catch (error: any) {
             toast.error("Échec de la suppression.", { description: error.message });
        } finally {
            setIsDeleting(null);
        }
    }


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Données</CardTitle>
                    <CardDescription>
                        Créez et restaurez des sauvegardes de vos données. Les sauvegardes sont stockées de manière sécurisée.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="font-semibold">Sauvegardes Existantes</h3>
                    {isLoading ? (
                         <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                         </div>
                    ) : backups.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune sauvegarde trouvée.</p>
                    ) : (
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {backups.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(backup => (
                                <div key={backup.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <FileClock className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-mono text-sm">{backup.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(backup.created_at), 'd MMM yyyy, HH:mm', { locale: fr })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline"
                                            size="sm" 
                                            onClick={() => handleRestoreClick(backup.name)}
                                            disabled={!!isRestoring || !!isDeleting}
                                        >
                                            {isRestoring === backup.name ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                            Restaurer
                                        </Button>
                                         <Button 
                                            variant="destructive"
                                            size="icon" 
                                            onClick={() => handleDeleteClick(backup.name)}
                                            disabled={!!isRestoring || !!isDeleting}
                                        >
                                            {isDeleting === backup.name ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCreateBackup} disabled={isCreating || !!isRestoring}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                        {isCreating ? 'Création en cours...' : 'Créer une nouvelle sauvegarde'}
                    </Button>
                </CardFooter>
            </Card>

            <ConfirmAlertDialog
                isOpen={isRestoreConfirmOpen}
                onOpenChange={setIsRestoreConfirmOpen}
                title="Êtes-vous absolument sûr de vouloir restaurer ?"
                description={
                    <div className="space-y-4">
                        <p>Cette action est <span className="font-bold text-destructive">irréversible</span> et remplacera <span className="font-bold">TOUTES</span> vos données actuelles (produits, ventes, clients, etc.) par le contenu de cette sauvegarde.</p>
                        <div className="p-3 bg-destructive/10 rounded-lg text-destructive flex items-start gap-2">
                            <AlertTriangle className="h-8 w-8 mt-1"/>
                            <div>
                                <h4 className="font-bold">Risque de perte de données !</h4>
                                <p className="text-xs">Assurez-vous d'avoir créé une sauvegarde de vos données actuelles si vous pourriez en avoir besoin plus tard.</p>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={handleConfirmRestore}
                confirmText="Oui, écraser et restaurer"
            />
            
            <ConfirmAlertDialog
                isOpen={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title="Supprimer cette sauvegarde ?"
                description="Cette action supprimera définitivement le fichier de sauvegarde. Vos données actuelles ne seront pas affectées."
                onConfirm={handleConfirmDelete}
                confirmText="Oui, supprimer la sauvegarde"
            />
        </>
    );
}

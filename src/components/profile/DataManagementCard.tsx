'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { backupService } from "@/services/backup.service";
import type { FileObject } from '@supabase/storage-js';
import { Loader2, Download, Upload, Trash2, AlertTriangle, FileClock, Eye, Database } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';
import { BackupPreview } from './BackupPreview';

export function DataManagementCard() {
    const [backups, setBackups] = useState<FileObject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isRestoring, setIsRestoring] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState<string | null>(null);

    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const [selectedBackupPath, setSelectedBackupPath] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);

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

    const handlePreviewClick = async (name: string) => {
        setIsPreviewing(name);
        try {
            const data = await backupService.getBackupData(name);
            setPreviewData(data);
            setIsPreviewOpen(true);
        } catch (error: any) {
            toast.error("Échec de la lecture de la sauvegarde.");
        } finally {
            setIsPreviewing(null);
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
            <Card className="luxury-glass border-white/5 overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
                        <Database className="h-5 w-5 text-primary" />
                        Coffre-fort des Données
                    </CardTitle>
                    <CardDescription>
                        Sauvegardez l'intégralité de votre commerce dans le Cloud iPOS.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="bg-muted/30 p-4 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3 mb-4">
                            <FileClock className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-sm uppercase tracking-widest">Historique des points de restauration</h3>
                        </div>
                        
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-xl border-white/10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                        ) : backups.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl border-white/10 bg-background/20">
                                <p className="text-sm font-medium italic">Aucune sauvegarde trouvée dans votre espace Cloud.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {backups.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(backup => (
                                    <div key={backup.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-background/40 border border-white/5 hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <FileClock className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-mono text-xs font-bold text-primary/80">{backup.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">
                                                    {format(new Date(backup.created_at), 'd MMMM yyyy, HH:mm', { locale: fr })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="rounded-lg h-9 text-[10px] font-black uppercase hover:bg-primary/10"
                                                onClick={() => handlePreviewClick(backup.name)}
                                                disabled={!!isRestoring || !!isDeleting || !!isPreviewing}
                                            >
                                                {isPreviewing === backup.name ? <Loader2 className="h-3 w-3 animate-spin"/> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                                                Aperçu
                                            </Button>
                                            <Button 
                                                variant="secondary"
                                                size="sm" 
                                                className="rounded-lg h-9 text-[10px] font-black uppercase bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                                                onClick={() => handleRestoreClick(backup.name)}
                                                disabled={!!isRestoring || !!isDeleting || !!isPreviewing}
                                            >
                                                {isRestoring === backup.name ? <Loader2 className="h-3 w-3 animate-spin"/> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                                                Restaurer
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                size="icon" 
                                                className="rounded-lg h-9 w-9 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(backup.name)}
                                                disabled={!!isRestoring || !!isDeleting || !!isPreviewing}
                                            >
                                                {isDeleting === backup.name ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="bg-white/5 p-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-muted-foreground italic max-w-sm text-center sm:text-left">
                        * Les sauvegardes incluent les stocks, clients, fournisseurs et l'historique complet des ventes.
                    </p>
                    <Button 
                        onClick={handleCreateBackup} 
                        disabled={isCreating || !!isRestoring}
                        className="bg-primary hover:bg-primary/90 rounded-xl px-8 h-11 font-bold shadow-lg shadow-primary/20 w-full sm:w-auto gap-2"
                    >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin"/> : <Upload className="h-4 w-4" />}
                        {isCreating ? 'Création...' : 'Nouvelle Sauvegarde Cloud'}
                    </Button>
                </CardFooter>
            </Card>

            <BackupPreview 
                isOpen={isPreviewOpen} 
                onOpenChange={setIsPreviewOpen} 
                data={previewData} 
            />

            <ConfirmAlertDialog
                isOpen={isRestoreConfirmOpen}
                onOpenChange={setIsRestoreConfirmOpen}
                title="⚠️ ATTENTION : RESTAURATION"
                description={
                    <div className="space-y-4 pt-2">
                        <p className="text-sm">Cette action va <span className="font-bold text-destructive underline">écraser l'intégralité</span> de vos données actuelles pour les remplacer par celles de la sauvegarde.</p>
                        <div className="p-4 bg-destructive/10 rounded-2xl text-destructive border border-destructive/20 flex items-start gap-3">
                            <AlertTriangle className="h-10 w-10 shrink-0"/>
                            <div className="space-y-1">
                                <h4 className="font-black text-xs uppercase tracking-widest">Risque de perte de données</h4>
                                <p className="text-[11px] leading-relaxed opacity-80">Si vous n'avez pas fait de sauvegarde aujourd'hui, les ventes saisies depuis votre dernier backup seront définitivement perdues.</p>
                            </div>
                        </div>
                    </div>
                }
                onConfirm={handleConfirmRestore}
                confirmText="Oui, restaurer et redémarrer"
            />
            
            <ConfirmAlertDialog
                isOpen={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title="Supprimer la sauvegarde ?"
                description="Ce fichier sera supprimé définitivement du Cloud iPOS. Cette action n'affectه pas vos données en cours d'utilisation."
                onConfirm={handleConfirmDelete}
                confirmText="Supprimer définitivement"
            />
        </>
    );
}

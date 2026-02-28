'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Download, Upload, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dataService } from '@/services/data-service';

export function BackupAndRestore() {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isRestoreAlertOpen, setIsRestoreAlertOpen] = useState(false);
    const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [resetConfirmationCode, setResetConfirmationCode] = useState('');


    const handleBackup = async () => {
        setIsBackingUp(true);
        toast.info("Préparation de la sauvegarde en cours...");

        try {
            const jsonString = await dataService.exportData();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `ipos-offline-backup-${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Sauvegarde téléchargée avec succès !");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde:", error);
            toast.error("Une erreur est survenue lors de la sauvegarde.");
        } finally {
            setIsBackingUp(false);
        }
    };
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                setRestoreFile(file);
                setIsRestoreAlertOpen(true);
            } else {
                toast.error("Veuillez sélectionner un fichier de sauvegarde JSON valide (`.json`).");
            }
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const executeRestore = async () => {
        if (!restoreFile) return;

        setIsRestoring(true);
        toast.info("Restauration en cours... Ne quittez pas cette page.");

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonString = e.target?.result as string;
                await dataService.importData(jsonString);

                toast.success("Restauration terminée avec succès !", {
                    description: "L'application va maintenant se recharger."
                });

                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                console.error("Erreur lors de la restauration:", error);
                toast.error("Erreur lors de la restauration. Vérifiez le fichier de sauvegarde.", { duration: 10000 });
                setIsRestoring(false);
            }
        };
        reader.onerror = () => {
             toast.error("Erreur de lecture du fichier.");
             setIsRestoring(false);
        };

        reader.readAsText(restoreFile);
    };

    const executeReset = async () => {
        setIsResetting(true);
        toast.info("Réinitialisation en cours... Suppression de toutes les données.");

        try {
            await dataService.resetDatabase();
            toast.success("Réinitialisation terminée avec succès !", {
                description: "L'application va maintenant se recharger."
            });

            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error("Erreur lors de la réinitialisation:", error);
            toast.error("Erreur lors de la réinitialisation.", { duration: 10000 });
        } finally {
            setIsResetting(false);
            setIsResetAlertOpen(false);
        }
    };

    const handleOpenResetAlert = (open: boolean) => {
        if (!open) {
            setResetConfirmationCode('');
        }
        setIsResetAlertOpen(open);
    }

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden"
                accept=".json"
                onChange={handleFileSelect}
            />
            <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="font-semibold">Télécharger une sauvegarde</h4>
                    <p className="text-sm text-muted-foreground">
                        Créez un fichier JSON contenant toutes les données de votre application. Conservez ce fichier en lieu sûr.
                    </p>
                </div>
                 <div className="space-y-2">
                    <h4 className="font-semibold">Restaurer une sauvegarde</h4>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-destructive">Attention:</span> Cette action écrasera toutes les données actuelles de l'application.
                    </p>
                </div>
            </CardContent>
            <CardFooter className="grid sm:grid-cols-2 gap-4 border-t pt-6">
                <Button onClick={handleBackup} disabled={isBackingUp || isRestoring || isResetting} className="w-full">
                    {isBackingUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isBackingUp ? 'Sauvegarde...' : 'Télécharger la sauvegarde'}
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isBackingUp || isRestoring || isResetting} className="w-full">
                     {isRestoring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {isRestoring ? 'Restauration...' : 'Restaurer depuis un fichier'}
                </Button>
            </CardFooter>
            
            <div className="px-6 pb-6">
                <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-r-lg">
                    <h4 className="font-bold text-destructive">Zone de Danger</h4>
                    <p className="text-sm text-destructive/90 mt-1 mb-4">
                        L'action ci-dessous est irréversible. Assurez-vous d'avoir une sauvegarde récente avant de continuer.
                    </p>
                    <Button variant="destructive" onClick={() => handleOpenResetAlert(true)} disabled={isBackingUp || isRestoring || isResetting}>
                        {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        {isResetting ? 'Réinitialisation...' : 'Réinitialiser l\'application'}
                    </Button>
                </div>
            </div>

            <AlertDialog open={isRestoreAlertOpen} onOpenChange={setIsRestoreAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            Êtes-vous absolument sûr ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est <span className="font-bold">irréversible</span> et remplacera <span className="font-bold">toutes</span> les données actuelles par le contenu du fichier <span className="font-mono bg-muted px-1 py-0.5 rounded">{restoreFile?.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRestoreFile(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeRestore} 
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Confirmer et écraser les données
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={isResetAlertOpen} onOpenChange={handleOpenResetAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            Êtes-vous sûr de vouloir réinitialiser ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                             Cette action est <span className="font-bold">IRRÉVERSIBLE</span>. Toutes vos données (produits, ventes, clients, etc.) seront définitivement supprimées.
                            <br/><br/>
                             Pour confirmer, veuillez taper <strong className="font-mono text-destructive">supprimer</strong> dans le champ ci-dessous.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label htmlFor="reset-confirm" className="sr-only">Confirmation de réinitialisation</Label>
                        <Input
                            id="reset-confirm"
                            value={resetConfirmationCode}
                            onChange={(e) => setResetConfirmationCode(e.target.value)}
                            placeholder="Tapez 'supprimer' pour confirmer"
                            autoComplete="off"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeReset} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isResetting || resetConfirmationCode.toLowerCase() !== 'supprimer'}
                        >
                            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmer et réinitialiser
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

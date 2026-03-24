'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { dataService } from '@/services/data-service';
import { Download, Upload, Trash2, Eye } from 'lucide-react';
import { BackupRestoreConfirm } from './BackupRestoreConfirm';
import { BackupPreview } from './BackupPreview';
import { BackupStats } from './BackupStats';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';

export function BackupAndRestore() {
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [backupData, setBackupData] = useState<any>(null);
    const [fileName, setFileName] = useState('');

    const stats = useLiveQuery(async () => {
        const counts = await Promise.all([
            db.products.count(),
            db.customers.count(),
            db.sales.count(),
        ]);
        return {
            products: counts[0],
            customers: counts[1],
            sales: counts[2],
        };
    });

    const handleBackup = async () => {
        try {
            const data = await dataService.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `ipos-backup-${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Sauvegarde téléchargée avec succès.");
        } catch (error) {
            toast.error("Erreur lors de la création de la sauvegarde.");
        }
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    setBackupData(json);
                    setFileName(file.name);
                    setIsRestoreConfirmOpen(true);
                } catch (error) {
                    toast.error("Fichier de sauvegarde invalide ou corrompu.");
                }
            };
            reader.readAsText(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleRestore = async (dataToRestore: any) => {
        try {
            await dataService.restoreTables(dataToRestore);
            toast.success("Restauration terminée avec succès. L'application va se recharger.", {
                duration: 5000,
                onDismiss: () => window.location.reload(),
                onAutoClose: () => window.location.reload(),
            });
        } catch (error) {
            toast.error("Erreur lors de la restauration.");
        } finally {
            setIsRestoreConfirmOpen(false);
            setBackupData(null);
        }
    };

    const handleReset = async () => {
        try {
            await dataService.resetDatabase();
            toast.success("Base de données réinitialisée. L'application va se recharger.", {
                duration: 5000,
                onDismiss: () => window.location.reload(),
                onAutoClose: () => window.location.reload(),
            });
        } catch (error) {
            toast.error("Erreur lors de la réinitialisation.");
        } finally {
            setIsResetConfirmOpen(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Sauvegarde & Restauration</CardTitle>
                    <CardDescription>Gérez les données de votre application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Statistiques de la base de données</h3>
                        <BackupStats stats={stats} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handleBackup}><Download className="mr-2 h-4 w-4" /> Télécharger une sauvegarde</Button>
                        <Button asChild variant="outline">
                            <label htmlFor="restore-input">
                                <Upload className="mr-2 h-4 w-4" /> Restaurer depuis un fichier
                                <input type="file" id="restore-input" accept=".json" className="sr-only" onChange={handleFileSelected} />
                            </label>
                        </Button>
                    </div>

                     <div>
                        <h3 className="font-semibold text-destructive mb-2">Zone de Danger</h3>
                        <div className="border border-destructive/50 p-4 rounded-lg space-y-4">
                            <p className="text-sm text-destructive">
                                La réinitialisation effacera de manière permanente TOUTES les données de l'application, y compris les produits, les ventes et les clients. Cette action est irréversible.
                            </p>
                            <Button variant="destructive" onClick={() => setIsResetConfirmOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Réinitialiser la base de données</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <BackupRestoreConfirm
                isOpen={isResetConfirmOpen}
                onOpenChange={setIsResetConfirmOpen}
                onConfirm={handleReset}
                title="Êtes-vous absolument sûr ?"
                description="Cette action est irréversible et effacera toutes les données."
                confirmText="Oui, tout supprimer"
            />
            
            <BackupRestoreConfirm
                isOpen={isRestoreConfirmOpen}
                onOpenChange={setIsRestoreConfirmOpen}
                onConfirm={() => {
                    handleRestore(backupData);
                }}
                title="Confirmer la restauration"
                description={
                    <>
                        Vous êtes sur le point de remplacer toutes les données actuelles par le contenu du fichier 
                        <span className="font-bold font-mono mx-1">{fileName}</span>.
                        <div className="mt-4">
                             <Button variant="secondary" size="sm" onClick={(e) => { e.preventDefault(); setIsPreviewOpen(true); }}><Eye className="mr-2 h-4 w-4"/>Aperçu des données</Button>
                        </div>
                    </>
                }
                confirmText="Confirmer et restaurer"
            />
            
            <BackupPreview
                isOpen={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                data={backupData}
            />
        </>
    );
}

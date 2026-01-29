
'use client';

import { useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, doc, getDocs, getDoc, writeBatch, Timestamp } from 'firebase/firestore';
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
import type { User } from 'firebase/auth';

interface BackupAndRestoreProps {
    user: User;
}

const COLLECTIONS_TO_BACKUP = [
    'products', 
    'customers', 
    'sales', 
    'payments', 
    'stockIntakes', 
    'returns', 
    'breadCustomers', 
    'dailyBreadOrders'
];

export function BackupAndRestore({ user }: BackupAndRestoreProps) {
    const firestore = useFirestore();
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isRestoreAlertOpen, setIsRestoreAlertOpen] = useState(false);
    const [isResetAlertOpen, setIsResetAlertOpen] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = async () => {
        if (!firestore || !user) {
            toast.error("Impossible d'accéder à la base de données.");
            return;
        }

        setIsBackingUp(true);
        toast.info("Préparation de la sauvegarde en cours...");

        try {
            const backupData: { [key: string]: any } = {};

            for (const collectionName of COLLECTIONS_TO_BACKUP) {
                const collectionRef = collection(firestore, 'users', user.uid, collectionName);
                const snapshot = await getDocs(collectionRef);
                backupData[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            
            // Handle companyProfile separately as it's a single doc
            const companyProfileRef = doc(firestore, 'users', user.uid, 'companyProfile', 'main');
            const companyProfileSnap = await getDoc(companyProfileRef);
            if (companyProfileSnap.exists()) {
                backupData['companyProfile'] = { id: 'main', ...companyProfileSnap.data() };
            }

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `ipos-backup-${dateStr}.json`;
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
        // Reset file input to allow selecting the same file again
        if (event.target) {
            event.target.value = '';
        }
    };

    const isFirestoreTimestamp = (value: any): value is { seconds: number; nanoseconds: number } => {
        return value && typeof value.seconds === 'number' && typeof value.nanoseconds === 'number';
    };
    
    // Recursively find and convert Firestore Timestamps (serialized by JSON.stringify)
    const convertTimestamps = (data: any): any => {
        if (Array.isArray(data)) {
            return data.map(convertTimestamps);
        }
        if (data !== null && typeof data === 'object') {
            if (isFirestoreTimestamp(data)) {
                return new Timestamp(data.seconds, data.nanoseconds);
            }
            const newData: { [key: string]: any } = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = convertTimestamps(data[key]);
                }
            }
            return newData;
        }
        return data;
    };


    const executeRestore = async () => {
        if (!restoreFile || !firestore || !user) return;

        setIsRestoring(true);
        toast.info("Restauration en cours... Ne quittez pas cette page.");

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backupData = JSON.parse(e.target?.result as string);
                const BATCH_LIMIT = 499;

                // --- PHASE 1: DELETE ALL EXISTING DATA ---
                toast.info("Phase 1/2 : Suppression des données actuelles...");
                let deleteOps = 0;
                let deleteBatch = writeBatch(firestore);

                const collectionsToDelete = [...COLLECTIONS_TO_BACKUP];
                for (const collectionName of collectionsToDelete) {
                    const collectionRef = collection(firestore, 'users', user.uid, collectionName);
                    const snapshot = await getDocs(collectionRef);
                    for (const docSnapshot of snapshot.docs) {
                        deleteBatch.delete(docSnapshot.ref);
                        deleteOps++;
                        if (deleteOps >= BATCH_LIMIT) {
                            await deleteBatch.commit();
                            deleteBatch = writeBatch(firestore);
                            deleteOps = 0;
                        }
                    }
                }
                
                const companyProfileRef = doc(firestore, 'users', user.uid, 'companyProfile', 'main');
                const companyProfileSnap = await getDoc(companyProfileRef);
                if (companyProfileSnap.exists()) {
                    deleteBatch.delete(companyProfileRef);
                    deleteOps++;
                }

                if (deleteOps > 0) {
                    await deleteBatch.commit();
                }
                
                toast.info("Phase 2/2 : Écriture des nouvelles données...");

                // --- PHASE 2: WRITE NEW DATA FROM BACKUP ---
                let writeOps = 0;
                let writeBatchInstance = writeBatch(firestore);

                const commitWriteBatch = async () => {
                     if (writeOps > 0) {
                        await writeBatchInstance.commit();
                        writeBatchInstance = writeBatch(firestore);
                        writeOps = 0;
                    }
                };
                
                const collectionsToRestore = [...COLLECTIONS_TO_BACKUP];
                for (const collectionName of collectionsToRestore) {
                    if (backupData[collectionName]) {
                        const convertedData = convertTimestamps(backupData[collectionName]);
                        for (const itemData of convertedData) {
                            const { id, ...data } = itemData;
                            if (id) { // Ensure item has an ID
                                const docRef = doc(firestore, 'users', user.uid, collectionName, id);
                                writeBatchInstance.set(docRef, data);
                                writeOps++;
                                if (writeOps >= BATCH_LIMIT) {
                                    await commitWriteBatch();
                                }
                            }
                        }
                    }
                }

                if (backupData['companyProfile']) {
                    const { id, ...data } = backupData['companyProfile'];
                    const convertedData = convertTimestamps(data);
                    const companyRef = doc(firestore, 'users', user.uid, 'companyProfile', 'main');
                    writeBatchInstance.set(companyRef, convertedData);
                    writeOps++;
                }
                
                await commitWriteBatch(); // Commit any remaining writes

                toast.success("Restauration terminée avec succès !", {
                    description: "L'application va maintenant se recharger."
                });

                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                console.error("Erreur lors de la restauration:", error);
                toast.error("Erreur lors de la restauration. Vérifiez le fichier de sauvegarde et votre connexion.", { duration: 10000 });
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
        if (!firestore || !user) return;

        setIsResetting(true);
        toast.info("Réinitialisation en cours... Suppression de toutes les données.");

        try {
            const BATCH_LIMIT = 499;
            let deleteOps = 0;
            let deleteBatch = writeBatch(firestore);

            const commitDeleteBatch = async () => {
                if (deleteOps > 0) {
                    await deleteBatch.commit();
                    deleteBatch = writeBatch(firestore);
                    deleteOps = 0;
                }
            };

            for (const collectionName of COLLECTIONS_TO_BACKUP) {
                const collectionRef = collection(firestore, 'users', user.uid, collectionName);
                const snapshot = await getDocs(collectionRef);
                for (const docSnapshot of snapshot.docs) {
                    deleteBatch.delete(docSnapshot.ref);
                    deleteOps++;
                    if (deleteOps >= BATCH_LIMIT) {
                        await commitDeleteBatch();
                    }
                }
            }
            
            const companyProfileRef = doc(firestore, 'users', user.uid, 'companyProfile', 'main');
            const companyProfileSnap = await getDoc(companyProfileRef);
            if (companyProfileSnap.exists()) {
                deleteBatch.delete(companyProfileRef);
                deleteOps++;
            }

            await commitDeleteBatch();

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
                        Créez un fichier JSON contenant toutes les données de votre application (produits, ventes, etc.). Conservez ce fichier en lieu sûr.
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
                    <Button variant="destructive" onClick={() => setIsResetAlertOpen(true)} disabled={isBackingUp || isRestoring || isResetting}>
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
                            Cette action est <span className="font-bold">irréversible</span> et remplacera <span className="font-bold">toutes</span> les données actuelles de votre application par le contenu du fichier <span className="font-mono bg-muted px-1 py-0.5 rounded">{restoreFile?.name}</span>.
                            <br/><br/>
                            Assurez-vous d'avoir une sauvegarde récente si vous souhaitez pouvoir annuler cette opération.
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

             <AlertDialog open={isResetAlertOpen} onOpenChange={setIsResetAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                            Êtes-vous sûr de vouloir réinitialiser ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                             Cette action est <span className="font-bold">IRRÉVERSIBLE</span>. Toutes vos données (produits, ventes, clients, etc.) seront définitivement supprimées. Votre compte utilisateur sera conservé.
                            <br/><br/>
                            Il est fortement recommandé de télécharger une sauvegarde avant de continuer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeReset} 
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isResetting}
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

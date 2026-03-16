'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '@/services/data-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSync } from '@/hooks/useSync';

export function SyncData() {
    const { syncStatus, syncNow } = useSync();
    const companyProfile = useLiveQuery(() => dataService.getCompanyProfile());

    const handleSync = async () => {
        toast.info("Lancement de la synchronisation...");
        try {
            await syncNow();
            toast.success("Synchronisation terminée avec succès !");
        } catch (error: any) {
            console.error("Erreur lors de la synchronisation:", error);
            toast.error("Échec de la synchronisation.", {
                description: error.message || "Veuillez vérifier votre connexion et l'URL du script."
            });
        }
    };
    
    const canSync = !!companyProfile?.syncUrl;

    return (
        <>
            <CardContent>
                {!canSync && (
                    <div className="p-4 border-l-4 border-chart-secondary bg-chart-secondary/10 rounded-r-lg text-chart-secondary">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 mt-0.5" />
                            <div>
                                <h4 className="font-bold">URL de synchronisation manquante</h4>
                                <p className="text-sm text-chart-secondary/80">
                                    Veuillez ajouter une URL de script Google Apps dans l'onglet "Profil de l'entreprise" pour activer la synchronisation.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                 {syncStatus.lastSync && (
                    <p className="text-sm text-muted-foreground mt-4">
                        Dernière synchronisation réussie le : <span className="font-semibold">{format(new Date(syncStatus.lastSync), 'd MMMM yyyy à HH:mm', { locale: fr })}</span>
                    </p>
                )}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={handleSync} disabled={syncStatus.isSyncing || !canSync}>
                    {syncStatus.isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {syncStatus.isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}
                </Button>
            </CardFooter>
        </>
    );
}

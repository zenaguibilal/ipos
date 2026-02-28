'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { saveScriptUrl, syncAllData } from '@/services/sync-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '../ui/skeleton';


export function GoogleSync() {
    const [scriptUrl, setScriptUrl] = useState('');
    const [isSavingUrl, setIsSavingUrl] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const savedUrl = useLiveQuery(() => db.settings.get('googleScriptUrl'));
    const lastSyncDate = useLiveQuery(() => db.settings.get('lastSyncDate'));

    useEffect(() => {
        if (savedUrl?.value) {
            setScriptUrl(savedUrl.value);
        }
    }, [savedUrl]);

    const handleSaveUrl = async () => {
        setIsSavingUrl(true);
        try {
            await saveScriptUrl(scriptUrl);
            toast.success("L'URL du script a été enregistrée avec succès.");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'enregistrement de l'URL.");
            console.error(error);
        } finally {
            setIsSavingUrl(false);
        }
    };
    
    const handleSync = async () => {
        setIsSyncing(true);
        toast.info("Démarrage de la synchronisation...");
        try {
            await syncAllData();
            toast.success("Synchronisation réussie !", {
                description: "Vos données ont été envoyées à Google Sheets.",
            });
        } catch (error: any) {
             toast.error(error.message || "La synchronisation a échoué.", {
                description: "Vérifiez votre connexion Internet et l'URL du script.",
             });
             console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };


    const isLoading = savedUrl === undefined || lastSyncDate === undefined;


    return (
        <>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="scriptUrl">URL du script Google Apps Script</Label>
                        <div className="flex gap-2">
                            <Input
                                id="scriptUrl"
                                type="url"
                                value={scriptUrl}
                                onChange={(e) => setScriptUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/..."
                                disabled={isSavingUrl || isSyncing}
                            />
                            <Button onClick={handleSaveUrl} disabled={isSavingUrl || isSyncing || !scriptUrl} size="icon">
                                {isSavingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                        </div>
                         {lastSyncDate?.value && (
                            <p className="text-xs text-muted-foreground">
                                Dernière synchronisation : {format(new Date(lastSyncDate.value), "d MMMM yyyy 'à' HH:mm:ss", { locale: fr })}
                            </p>
                         )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t pt-6">
                <Button onClick={handleSync} disabled={isSyncing || isSavingUrl || !scriptUrl} className="w-full sm:w-auto">
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSyncing ? 'Synchronisation...' : 'Synchroniser les données'}
                </Button>
            </CardFooter>
        </>
    );
}

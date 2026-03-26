
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BackupTableList } from './BackupTableList';
import { BackupTableEditor } from './BackupTableEditor';
import { BackupStats } from './BackupStats';
import { Database, FileJson, Info } from 'lucide-react';
import { Separator } from '../ui/separator';

interface BackupPreviewProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    data: any;
}

export function BackupPreview({ isOpen, onOpenChange, data }: BackupPreviewProps) {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    const handleSelectTable = (tableName: string) => {
        setSelectedTable(tableName);
    };

    const handleBack = () => {
        setSelectedTable(null);
    };

    const stats = useMemo(() => {
        if (!data) return null;
        return {
            products: data.products?.length || 0,
            customers: data.customers?.length || 0,
            sales: data.sales?.length || 0,
        };
    }, [data]);

    if (!data) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col luxury-glass border-white/10 overflow-hidden p-0">
                <DialogHeader className="p-6 bg-primary/5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileJson className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="font-black uppercase tracking-tight">Analyse de la Sauvegarde</DialogTitle>
                            <DialogDescription>
                                {selectedTable ? `Exploration de la table : ${selectedTable}` : 'Consultez les statistiques et le contenu brut du point de restauration.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-hidden flex flex-col p-6">
                    {!selectedTable && (
                        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                            <BackupStats stats={stats} />
                            <div className="mt-6 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-200/70 leading-relaxed">
                                    Cliquez sur l'une des tables ci-dessous pour inspecter les données individuelles. Cette vue vous permet de vérifier l'intégrité de vos enregistrements avant toute opération de restauration.
                                </p>
                            </div>
                            <Separator className="my-6 bg-white/5" />
                        </div>
                    )}

                    <div className="flex-grow overflow-hidden">
                        {selectedTable ? (
                            <BackupTableEditor
                                tableName={selectedTable}
                                tableData={data[selectedTable] || []}
                                onBack={handleBack}
                            />
                        ) : (
                            <div className="h-full">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                    <Database className="h-3 w-3" />
                                    Architecture des données ({Object.keys(data).length} tables)
                                </h4>
                                <BackupTableList data={data} onSelectTable={handleSelectTable} />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 bg-white/5 border-t border-white/5">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">
                        Fermer l'aperçu
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

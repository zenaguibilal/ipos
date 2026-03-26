
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
import { Database, FileJson, Info, Search } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';

interface BackupPreviewProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    data: any;
}

export function BackupPreview({ isOpen, onOpenChange, data }: BackupPreviewProps) {
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectTable = (tableName: string) => {
        setSelectedTable(tableName);
        setSearchQuery('');
    };

    const handleBack = () => {
        setSelectedTable(null);
        setSearchQuery('');
    };

    const stats = useMemo(() => {
        if (!data) return null;
        return {
            products: data.products?.length || 0,
            customers: data.customers?.length || 0,
            sales: data.sales?.length || 0,
        };
    }, [data]);

    const filteredTableData = useMemo(() => {
        if (!selectedTable || !data[selectedTable]) return [];
        const tableRows = data[selectedTable];
        if (!searchQuery.trim()) return tableRows;

        const q = searchQuery.toLowerCase().trim();
        return tableRows.filter((row: any) => 
            Object.values(row).some(val => 
                String(val).toLowerCase().includes(q)
            )
        );
    }, [selectedTable, data, searchQuery]);

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
                    {!selectedTable ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-top-2 duration-500">
                            <BackupStats stats={stats} />
                            <div className="mt-6 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-200/70 leading-relaxed">
                                    Cliquez sur l'une des tables ci-dessous pour inspecter les données individuelles. Cette vue vous permet de vérifier l'intégrité de vos enregistrements avant toute opération de restauration.
                                </p>
                            </div>
                            <Separator className="my-6 bg-white/5" />
                            <div className="flex-grow overflow-hidden">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                    <Database className="h-3 w-3" />
                                    Architecture des données ({Object.keys(data).length} tables)
                                </h4>
                                <BackupTableList data={data} onSelectTable={handleSelectTable} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <Button variant="ghost" onClick={handleBack} className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-9">
                                    ← Retour
                                </Button>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Filtrer dans la table..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-9 pl-9 rounded-xl border-white/10 bg-background/50 text-xs"
                                    />
                                </div>
                            </div>
                            <BackupTableEditor
                                tableName={selectedTable}
                                tableData={filteredTableData}
                                onBack={handleBack}
                            />
                        </div>
                    )}
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

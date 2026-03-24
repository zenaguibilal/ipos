'use client';

import { useState } from 'react';
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

    if (!data) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Aperçu du Fichier de Sauvegarde</DialogTitle>
                    <DialogDescription>
                        {selectedTable ? `Aperçu de la table : ${selectedTable}` : 'Sélectionnez une table pour voir son contenu.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    {selectedTable ? (
                        <BackupTableEditor
                            tableName={selectedTable}
                            tableData={data[selectedTable] || []}
                            onBack={handleBack}
                        />
                    ) : (
                        <BackupTableList data={data} onSelectTable={handleSelectTable} />
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer l'aperçu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

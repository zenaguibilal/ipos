'use client';

import { useState } from 'react';
import type { DB } from '@/lib/types';
import { dataService } from '@/services/data-service';
import { toast } from 'sonner';

import { BackupStats } from './BackupStats';
import { BackupTableList } from './BackupTableList';
import { BackupTableEditor } from './BackupTableEditor';
import { BackupRestoreConfirm } from './BackupRestoreConfirm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const STEPS = {
  STATS:    'stats',
  SELECT:   'select',
  EDIT:     'edit',
  CONFIRM:  'confirm',
  RESTORING:'restoring'
};

const RestoreProgress = ({ progress }: { progress: any }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2"><Loader2 className="animate-spin" /> Restauration en cours...</h3>
    <Progress value={(progress.current / progress.total) * 100} className="w-full mb-4" />
    <p className="text-lg mb-2">
      Table en cours : <strong className="text-primary">{progress.currentTable}</strong>
    </p>
    <p className="text-muted-foreground mb-6">{progress.current} / {progress.total} tables traitées</p>

    <ScrollArea className="h-48 w-full bg-muted/50 rounded-lg p-4 text-left">
      {progress.done.map((item: any, i: number) => (
        <div key={i} className={`flex items-center gap-2 text-sm mb-1 ${item.success ? 'text-green-500' : 'text-destructive'}`}>
          {item.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} 
          <span>{item.table}</span>
          {item.error && <span className="text-xs"> — {item.error}</span>}
        </div>
      ))}
    </ScrollArea>
  </div>
);


export function BackupPreview({ backupData, onClose, onComplete }: { backupData: Partial<DB>, onClose: () => void, onComplete: () => void }) {
  const [step, setStep] = useState(STEPS.STATS);
  const [editedData, setEditedData] = useState(backupData);
  const [selectedTables, setSelectedTables] = useState(Object.keys(backupData));
  const [currentEditTable, setCurrentEditTable] = useState<string | null>(null);
  const [restoreProgress, setRestoreProgress] = useState({
    current: 0,
    total: 0,
    currentTable: '',
    done: []
  });

  const handleEditTable = (tableName: string) => {
    setCurrentEditTable(tableName);
    setStep(STEPS.EDIT);
  };

  const handleSaveTableEdits = (tableName: string, newRecords: any[]) => {
    setEditedData(prev => ({ ...prev, [tableName]: newRecords }));
    setCurrentEditTable(null);
    setStep(STEPS.SELECT);
  };

  const handleStartRestore = async () => {
    setStep(STEPS.RESTORING);
    const tablesToRestore = selectedTables.filter(
      t => editedData[t as keyof typeof editedData] !== undefined
    );

    try {
        await dataService.restoreTables(
            editedData as Partial<DB>, 
            tablesToRestore as (keyof DB)[], 
            (progress) => setRestoreProgress(progress)
        );
        toast.success("Restauration terminée !");
        setTimeout(() => onComplete(), 1500);
    } catch (error: any) {
        toast.error("Une erreur majeure est survenue pendant la restauration.", { description: error.message });
    }
  };
  
  const stepConfig = [
      { key: STEPS.STATS,   label: '1. Statistiques' },
      { key: STEPS.SELECT,  label: '2. Sélection' },
      { key: STEPS.EDIT,    label: '3. Édition' },
      { key: STEPS.CONFIRM, label: '4. Confirmation' },
  ];
  const currentStepIndex = stepConfig.findIndex(s => s.key === step);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-2xl">📦 Aperçu de la Sauvegarde</DialogTitle>
                        <DialogDescription>Vérifiez, modifiez et sélectionnez les données à restaurer.</DialogDescription>
                    </div>
                    {step !== STEPS.RESTORING && (
                        <Button onClick={onClose} variant="ghost" size="icon" className="rounded-full">✕</Button>
                    )}
                </div>
            </DialogHeader>

            {step !== STEPS.RESTORING && (
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  {stepConfig.map((s, index) => (
                    <div key={s.key} className="flex-1 text-center">
                      <p className={`font-bold text-sm ${currentStepIndex >= index ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</p>
                      <div className={`mt-2 h-1 mx-auto rounded-full ${currentStepIndex >= index ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto p-6">
              {step === STEPS.STATS && (
                <BackupStats
                  backupData={editedData}
                  onNext={() => setStep(STEPS.SELECT)}
                />
              )}
              {step === STEPS.SELECT && (
                <BackupTableList
                  backupData={editedData}
                  selectedTables={selectedTables}
                  onSelectionChange={setSelectedTables}
                  onEditTable={handleEditTable}
                  onNext={() => setStep(STEPS.CONFIRM)}
                  onBack={() => setStep(STEPS.STATS)}
                />
              )}
              {step === STEPS.EDIT && currentEditTable && (
                <BackupTableEditor
                  tableName={currentEditTable}
                  records={editedData[currentEditTable as keyof typeof editedData] || []}
                  onSave={handleSaveTableEdits}
                  onCancel={() => setStep(STEPS.SELECT)}
                />
              )}
              {step === STEPS.CONFIRM && (
                <BackupRestoreConfirm
                  selectedTables={selectedTables}
                  editedData={editedData}
                  onConfirm={handleStartRestore}
                  onBack={() => setStep(STEPS.SELECT)}
                />
              )}
              {step === STEPS.RESTORING && (
                <RestoreProgress progress={restoreProgress} />
              )}
            </div>
        </DialogContent>
    </Dialog>
  );
}

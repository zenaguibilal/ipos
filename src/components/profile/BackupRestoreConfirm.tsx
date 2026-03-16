'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, ListChecks, Loader2 } from 'lucide-react';
import type { DB } from '@/lib/types';

interface BackupRestoreConfirmProps {
  selectedTables: string[];
  editedData: Partial<DB>;
  onConfirm: () => void;
  onBack: () => void;
}

export function BackupRestoreConfirm({ selectedTables, editedData, onConfirm, onBack }: BackupRestoreConfirmProps) {
  const [confirmText, setConfirmText] = useState('');
  const CONFIRM_WORD = 'RESTAURER';
  const isConfirmDisabled = confirmText !== CONFIRM_WORD;

  const totalRecords = selectedTables.reduce((acc, table) => {
    const records = editedData[table as keyof typeof editedData];
    return acc + (Array.isArray(records) ? records.length : 0);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Attention — Action irréversible !</AlertTitle>
        <AlertDescription>
          Cette action va remplacer définitivement les données des tables sélectionnées par celles de la sauvegarde. Les tables non sélectionnées ne seront pas affectées.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Résumé de la restauration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-primary" />
              <span className="font-medium">Tables à restaurer</span>
            </div>
            <span className="font-bold text-lg">{selectedTables.length}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <span className="font-medium">Total des enregistrements</span>
            </div>
            <span className="font-bold text-lg">{totalRecords.toLocaleString()}</span>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="confirm-input" className="font-semibold">
              Pour confirmer, veuillez taper <strong className="text-destructive">{CONFIRM_WORD}</strong> ci-dessous.
            </Label>
            <Input
              id="confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="outline">
          ← Retour
        </Button>
        <Button onClick={onConfirm} disabled={isConfirmDisabled} variant="destructive">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Confirmer et Restaurer
        </Button>
      </div>
    </div>
  );
}

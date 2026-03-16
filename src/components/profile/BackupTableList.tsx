'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowRight, Edit } from 'lucide-react';

interface BackupTableListProps {
  backupData: { [key: string]: any[] };
  selectedTables: string[];
  onSelectionChange: (tables: string[]) => void;
  onEditTable: (tableName: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BackupTableList({ backupData, selectedTables, onSelectionChange, onEditTable, onNext, onBack }: BackupTableListProps) {
  const tables = Object.keys(backupData);

  const toggleTable = (name: string) => {
    onSelectionChange(
      selectedTables.includes(name)
        ? selectedTables.filter(t => t !== name)
        : [...selectedTables, name]
    );
  };

  const selectAll = () => onSelectionChange(tables);
  const deselectAll = () => onSelectionChange([]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sélectionnez les tables à restaurer</CardTitle>
          <CardDescription>
            ⚠️ Les données actuelles des tables sélectionnées seront remplacées par celles de la sauvegarde.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 p-2 bg-muted rounded-lg">
            <Button onClick={selectAll} variant="secondary" size="sm">Tout sélectionner</Button>
            <Button onClick={deselectAll} variant="secondary" size="sm">Tout désélectionner</Button>
            <p className="text-sm text-muted-foreground ml-auto">
              {selectedTables.length} / {tables.length} tables sélectionnées
            </p>
          </div>

          <ScrollArea className="h-72 border rounded-lg p-2">
            <div className="space-y-2">
              {tables.map(name => {
                const records = backupData[name];
                const count = Array.isArray(records) ? records.length : (records ? 1 : 0);
                const isSelected = selectedTables.includes(name);

                return (
                  <div key={name} className={`flex items-center p-2 rounded-md transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTable(name)}
                      id={`table-${name}`}
                      className="mr-3 h-5 w-5"
                    />
                    <label htmlFor={`table-${name}`} className="flex-grow cursor-pointer">
                      <span className="font-semibold">{name}</span>
                      <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {count.toLocaleString()} enregistrements
                      </span>
                    </label>
                    {count > 0 && Array.isArray(records) && (
                      <Button onClick={() => onEditTable(name)} variant="ghost" size="sm" className="h-8">
                        <Edit className="mr-2 h-4 w-4" /> Modifier
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
        <Button onClick={onNext} disabled={selectedTables.length === 0} size="lg">
          Suivant — Confirmer ({selectedTables.length} tables) <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

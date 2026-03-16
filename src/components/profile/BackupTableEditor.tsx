'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Check, Search, Trash2, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface BackupTableEditorProps {
  tableName: string;
  records: any[];
  onSave: (tableName: string, newRecords: any[]) => void;
  onCancel: () => void;
}

export function BackupTableEditor({ tableName, records, onSave, onCancel }: BackupTableEditorProps) {
  const [editedRecords, setEditedRecords] = useState<any[]>(JSON.parse(JSON.stringify(records)));
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  const columns = useMemo(() => {
    if (editedRecords.length === 0) return [];
    return Object.keys(editedRecords[0]).filter(key => key !== 'id' && typeof editedRecords[0][key] !== 'object').slice(0, 5);
  }, [editedRecords]);

  const filteredRecords = useMemo(() => {
    return editedRecords.filter(record => {
      if (!searchQuery) return true;
      return Object.values(record).some(val =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [editedRecords, searchQuery]);

  const startEdit = (record: any) => {
    setEditingId(record.id);
    setEditingRecord({ ...record });
  };

  const saveEdit = () => {
    setEditedRecords(prev =>
      prev.map(r => r.id === editingId ? editingRecord : r)
    );
    setEditingId(null);
    setEditingRecord(null);
    toast.success("Enregistrement mis à jour dans l'aperçu.");
  };

  const deleteRecord = (id: string | number) => {
    setEditedRecords(prev => prev.filter(r => r.id !== id));
    toast.warning("Enregistrement supprimé de l'aperçu.", { description: "La suppression ne sera finale qu'après la sauvegarde." });
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditingRecord((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(tableName, editedRecords);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold">✏️ Modifier — {tableName}</h3>
          <div className="text-sm text-muted-foreground flex gap-4">
            <span>{editedRecords.length} / {records.length} enregistrements restants</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <ScrollArea className="border rounded-lg flex-grow">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead>id</TableHead>
              {columns.map(col => <TableHead key={col}>{col}</TableHead>)}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map(record => (
              <TableRow key={record.id}>
                {editingId === record.id ? (
                  <>
                    <TableCell className="font-mono text-xs w-24">{record.id}</TableCell>
                    {columns.map(col => (
                      <TableCell key={col}>
                        <Input
                          type="text"
                          value={editingRecord[col] ?? ''}
                          onChange={e => handleFieldChange(col, e.target.value)}
                          className="h-8"
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button onClick={saveEdit} size="icon" variant="ghost" className="h-8 w-8 text-green-500"><Check className="h-4 w-4" /></Button>
                      <Button onClick={() => setEditingId(null)} size="icon" variant="ghost" className="h-8 w-8 text-red-500"><X className="h-4 w-4" /></Button>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-mono text-xs text-muted-foreground w-24">{String(record.id).slice(0, 8)}...</TableCell>
                    {columns.map(col => (
                      <TableCell key={col} className="max-w-xs truncate">{String(record[col] ?? '')}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button onClick={() => startEdit(record)} size="icon" variant="ghost" className="h-8 w-8"><Search className="h-4 w-4" /></Button>
                      <Button onClick={() => deleteRecord(record.id)} size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex justify-between items-center mt-6">
        <Button onClick={onCancel} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Annuler</Button>
        <Button onClick={handleSave}>
          <Check className="mr-2 h-4 w-4" /> Sauvegarder les modifications
        </Button>
      </div>
    </div>
  );
}

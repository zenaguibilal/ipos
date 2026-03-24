'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BackupTableListProps {
    data: any;
    onSelectTable: (tableName: string) => void;
}

export function BackupTableList({ data, onSelectTable }: BackupTableListProps) {
    const tableNames = Object.keys(data);

    return (
        <ScrollArea className="h-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom de la Table</TableHead>
                        <TableHead>Nombre d'entrées</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableNames.map(tableName => (
                        <TableRow key={tableName}>
                            <TableCell className="font-medium">{tableName}</TableCell>
                            <TableCell>{Array.isArray(data[tableName]) ? data[tableName].length : 'N/A'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => onSelectTable(tableName)}>
                                    Voir le contenu
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
}

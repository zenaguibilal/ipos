
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface BackupTableEditorProps {
    tableName: string;
    tableData: any[];
    onBack: () => void;
}

export function BackupTableEditor({ tableName, tableData, onBack }: BackupTableEditorProps) {
    const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 mb-4">
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux tables
                </Button>
            </div>
            {tableData.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-muted-foreground">
                    La table "{tableName}" est vide.
                </div>
            ) : (
                <div className="flex-grow overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                            <TableRow>
                                {columns.map(col => <TableHead key={col}>{col}</TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tableData.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map(col => (
                                        <TableCell key={`${rowIndex}-${col}`} className="max-w-xs truncate">
                                            {typeof row[col] === 'object' && row[col] !== null ? JSON.stringify(row[col]) : String(row[col])}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

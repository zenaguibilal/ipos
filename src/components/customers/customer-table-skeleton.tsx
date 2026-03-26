
'use client';

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CustomerTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] px-4"><Skeleton className="h-4 w-4" /></TableHead>
                        <TableHead>Nom du Client</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead className="hidden md:table-cell">Adresse</TableHead>
                        <TableHead className="text-right">Limite Crédit</TableHead>
                        <TableHead className="text-right">Total Dépensé</TableHead>
                        <TableHead className="text-right">Solde Impayé</TableHead>
                        <TableHead className="w-[50px] text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4"><Skeleton className="h-4 w-4" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

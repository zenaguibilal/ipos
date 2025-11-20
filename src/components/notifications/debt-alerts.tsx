
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerWithSalesData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Users } from "lucide-react";
import Link from "next/link";

interface DebtAlertsProps {
    customers: CustomerWithSalesData[];
}

export function DebtAlerts({ customers }: DebtAlertsProps) {
    const router = useRouter();

    if (customers.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                         <Users className="h-5 w-5 text-orange-500" />
                        Rappels de paiement ({customers.length})
                    </CardTitle>
                    <CardDescription>
                        Ces clients ont un paiement de dette prévu pour demain.
                    </CardDescription>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/customers">Gérer les clients</Link>
                </Button>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead className="text-right">Solde Impayé</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map(customer => (
                            <TableRow key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer">
                                <TableCell>
                                    <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                </TableCell>
                                <TableCell>
                                    {customer.phone || '-'}
                                </TableCell>
                                <TableCell className="text-right font-bold text-destructive">
                                    {customer.outstandingBalance.toFixed(2)} DA
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

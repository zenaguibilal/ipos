
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TopCustomer } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

interface TopCustomersProps {
    customers: TopCustomer[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
    const router = useRouter();

    return (
        <Card className="bg-card h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                 <div>
                     <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        Top 5 Clients (Dépenses)
                    </CardTitle>
                    <CardDescription>
                        Le top 5 des clients par total dépensé sur la période.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                 {customers.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée client à afficher.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Total Dépensé</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map(customer => (
                                     <TableRow key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>
                                            <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-primary">
                                            {customer.totalSpent.toFixed(2)} DA
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

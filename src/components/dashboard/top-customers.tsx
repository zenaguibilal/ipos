
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TopCustomer } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

interface TopCustomersProps {
    customers: TopCustomer[];
}

export function TopCustomers({ customers }: TopCustomersProps) {
    const router = useRouter();

    if (customers.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        Meilleurs clients
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        Aucune donnée client pour afficher le classement.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                     <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        Meilleurs clients
                    </CardTitle>
                    <CardDescription>
                        Le top 5 des clients par total de dépenses.
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
                            <TableHead className="text-right">Total Dépensé</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map(customer => (
                            <TableRow key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer">
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
            </CardContent>
        </Card>
    );
}

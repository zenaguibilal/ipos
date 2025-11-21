
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerWithSalesData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Users, MessageSquare } from "lucide-react";
import Link from "next/link";

interface DebtAlertsProps {
    customers: CustomerWithSalesData[];
}

export function DebtAlerts({ customers }: DebtAlertsProps) {
    const router = useRouter();

    const handleWhatsAppClick = (e: React.MouseEvent, customer: CustomerWithSalesData) => {
        e.stopPropagation(); // Prevent row click
        if (!customer.phone) return;

        const message = `Bonjour ${customer.firstName} ${customer.lastName}, juste un petit rappel concernant votre solde de ${customer.outstandingBalance.toFixed(2)} DA. Merci.`;
        const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (customers.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                    <CardTitle className="flex items-center gap-2">
                         <Users className="h-5 w-5 text-orange-500" />
                        Clients avec dettes impayées ({customers.length})
                    </CardTitle>
                    <CardDescription>
                        Ces clients ont un solde impayé.
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
                            <TableHead className="text-right">Action</TableHead>
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
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleWhatsAppClick(e, customer)}
                                        disabled={!customer.phone}
                                        aria-label="Envoyer un message WhatsApp"
                                    >
                                        <MessageSquare className="h-5 w-5 text-green-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

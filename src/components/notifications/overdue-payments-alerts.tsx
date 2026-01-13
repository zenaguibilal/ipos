
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerWithSalesData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface OverduePaymentsAlertsProps {
    customers: CustomerWithSalesData[];
}

export function OverduePaymentsAlerts({ customers }: OverduePaymentsAlertsProps) {
    const router = useRouter();

    if (customers.length === 0) {
        return null;
    }

    const handleWhatsAppClick = (customer: CustomerWithSalesData) => {
         if (!customer || !customer.phone) {
            toast.error("Le numéro de téléphone du client n'est pas disponible.");
            return;
        }

        const message = `Bonjour ${customer.firstName} ${customer.lastName}, ceci est un rappel amical que votre solde de ${customer.outstandingBalance.toFixed(2)} DA est maintenant dû. Merci de régler votre dû dès que possible.`;
        
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Retards de paiement ({customers.length})
                </CardTitle>
                <CardDescription>
                    Ces clients ont dépassé leur jour de règlement ce mois-ci sans solder leur dette.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead className="text-right">Jours de retard</TableHead>
                            <TableHead className="text-right">Solde Actuel</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.map(customer => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">{customer.firstName} {customer.lastName}</Link>
                                </TableCell>
                                 <TableCell>{customer.phone || 'N/A'}</TableCell>
                                <TableCell className="text-right font-medium text-destructive">
                                    {customer.daysLate} jour(s)
                                </TableCell>
                                <TableCell className="text-right font-bold text-destructive">
                                    {customer.outstandingBalance.toFixed(2)} DA
                                </TableCell>
                                 <TableCell className="text-center">
                                    {customer.phone ? (
                                         <Button size="sm" variant="outline" onClick={() => handleWhatsAppClick(customer)}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Rappel
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Pas de numéro</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

    
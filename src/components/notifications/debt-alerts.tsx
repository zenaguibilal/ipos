
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomerWithSalesData, CompanyProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Users, MessageSquare, ArrowDown, Clock } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";


interface DebtAlertsProps {
    customers: CustomerWithSalesData[];
    companyProfile?: CompanyProfile | null;
}

export function DebtAlerts({ customers, companyProfile }: DebtAlertsProps) {
    const router = useRouter();

    const sortedCustomers = useMemo(() => {
        return [...customers].sort((a, b) => (b.daysLate ?? -Infinity) - (a.daysLate ?? -Infinity));
    }, [customers]);

    const handleWhatsAppClick = (e: React.MouseEvent, customer: CustomerWithSalesData) => {
        e.stopPropagation(); // Prevent row click
        if (!customer.phone) return;

        const companyName = companyProfile?.companyName || 'notre magasin';
        let message;

        if (customer.daysLate !== undefined && customer.daysLate >= 0) {
            message = `Bonjour ${customer.firstName} ${customer.lastName}, sauf erreur de notre part, votre solde de ${customer.outstandingBalance.toFixed(2)} DA auprès de ${companyName} est en attente de règlement. Merci de régulariser votre situation.`;
        } else {
            message = `Bonjour ${customer.firstName} ${customer.lastName}, juste un petit rappel de la part de ${companyName} concernant votre solde de ${customer.outstandingBalance.toFixed(2)} DA. Votre règlement est attendu pour bientôt.`;
        }
        
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`;
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
                        Clients avec un paiement à venir ou en retard.
                    </CardDescription>
                </div>
                 <Button asChild variant="outline" size="sm">
                    <Link href="/customers">Gérer les clients</Link>
                </Button>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead className="text-center">Jour de règlement</TableHead>
                            <TableHead className="text-center">
                                <div className="flex items-center justify-center">
                                    <span>Jours de retard/restants</span>
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Solde Impayé</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedCustomers.map(customer => (
                            <TableRow key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer hover:bg-muted">
                                <TableCell>
                                    <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                    <div className="text-sm text-muted-foreground">{customer.phone || '-'}</div>
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                    {customer.settlementDay ? `Le ${customer.settlementDay} de chaque mois` : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    {customer.daysLate !== undefined ? (
                                        <span className={cn(
                                            "font-bold",
                                            customer.daysLate >= 0 ? "text-destructive" : "text-blue-500"
                                        )}>
                                            {customer.daysLate >= 0 ? `${customer.daysLate} jour(s) de retard` : `${Math.abs(customer.daysLate)} jour(s) restants`}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
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

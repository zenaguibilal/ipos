
'use client';

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { CustomerWithSalesData } from "@/lib/types";
import { useRouter } from "next/navigation";
import { UserX, ArrowDown, ArrowUp } from "lucide-react";
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface InactiveCustomersAlertsProps {
    customers: CustomerWithSalesData[];
}

type SortableKeys = 'lastName' | 'lastActivityDate' | 'outstandingBalance';

export function InactiveCustomersAlerts({ customers }: InactiveCustomersAlertsProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'lastActivityDate', direction: 'ascending' });

    const sortedAndFilteredCustomers = useMemo(() => {
        let filteredCustomers = [...customers];

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            filteredCustomers = filteredCustomers.filter(customer =>
                `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(lowercasedQuery) ||
                customer.phone?.includes(lowercasedQuery)
            );
        }

        if (sortConfig !== null) {
            filteredCustomers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;
                
                let comparison = 0;
                if (aValue instanceof Date && bValue instanceof Date) {
                    comparison = aValue.getTime() - bValue.getTime();
                } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue;
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        
        return filteredCustomers;

    }, [customers, searchQuery, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <div className="h-3 w-3 ml-2" />; // Placeholder for alignment
        }
        return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
    };

    if (customers.length === 0) {
        return null;
    }
    
    const SortableHeader = ({ sortKey, children, className }: { sortKey: SortableKeys, children: React.ReactNode, className?: string }) => (
        <TableHead className={className}>
            <button onClick={() => requestSort(sortKey)} className="flex items-center">
                {children}
                {getSortIcon(sortKey)}
            </button>
        </TableHead>
    );

    return (
        <Card>
            <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-blue-500" />
                    Clients Inactifs ({customers.length})
                </CardTitle>
                <CardDescription>
                    Clients n'ayant effectué aucune transaction depuis plus de 20 jours.
                </CardDescription>
                 <Input 
                    placeholder="Rechercher par nom ou téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm mt-2"
                />
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <SortableHeader sortKey="lastName">Client</SortableHeader>
                            <TableHead>Dernière transaction</TableHead>
                            <SortableHeader sortKey="lastActivityDate" className="text-center">Jours d'inactivité</SortableHeader>
                            <SortableHeader sortKey="outstandingBalance" className="text-right">Solde du Compte</SortableHeader>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedAndFilteredCustomers.map(customer => {
                             const daysInactive = customer.lastActivityDate ? differenceInDays(new Date(), customer.lastActivityDate) : null;
                             return (
                                <TableRow key={customer.id} onClick={() => router.push(`/customers/${customer.id}`)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                                        <div className="text-sm text-muted-foreground">{customer.phone || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {customer.lastActivityDate 
                                            ? format(customer.lastActivityDate, 'd LLL yyyy', { locale: fr }) 
                                            : 'Aucune transaction'}
                                    </TableCell>
                                    <TableCell className="text-center font-bold">
                                        {daysInactive !== null ? daysInactive : 'N/A'}
                                    </TableCell>
                                    <TableCell className={cn("text-right font-medium", customer.outstandingBalance > 0 && "text-destructive")}>
                                        {customer.outstandingBalance.toFixed(2)} DA
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

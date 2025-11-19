'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query, where, documentId } from "firebase/firestore";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import type { Sale, Customer, SaleWithDetails } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'sales'));
    }, [firestore]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesQuery);

    const customerIds = useMemo(() => {
        if (!salesData || salesData.length === 0) return [];
        const ids = new Set(salesData.map(s => s.customerId));
        return Array.from(ids);
    }, [salesData]);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore || customerIds.length === 0) {
            return null;
        }
        return query(collection(firestore, 'customers'), where(documentId(), 'in', customerIds.slice(0, 30)));
    }, [firestore, customerIds]);

    const { data: customersData, isLoading: customersLoading, error: customersError } = useCollection<Customer>(customersQuery);

    const [enrichedSales, setEnrichedSales] = useState<SaleWithDetails[]>([]);

    useEffect(() => {
        if (salesData && salesData.length > 0 && customersData) {
            const customerMap = new Map(customersData.map(c => [c.id, c]));
            const salesWithCustomer: SaleWithDetails[] = salesData.map(sale => ({
                ...sale,
                customer: customerMap.get(sale.customerId),
            }));
            setEnrichedSales(salesWithCustomer);
        } else if (salesData) {
            setEnrichedSales(salesData);
        } else {
            setEnrichedSales([]);
        }
    }, [salesData, customersData]);

    if (salesLoading || (customerIds.length > 0 && customersLoading)) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (salesError || customersError) {
        const errorMessage = [salesError?.message, customersError?.message].filter(Boolean).join('; ');
        return <div className="text-destructive">Erreur lors du chargement des données: {errorMessage}</div>
    }

    return (
        <SalesHistoryList sales={enrichedSales} />
    );
}

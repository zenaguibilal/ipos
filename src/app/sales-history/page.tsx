'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import type { Sale, Customer, SaleWithDetails } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    const salesRef = useMemoFirebase(() => {
        // This is a simplification. A real app would use a collection group query
        // or fetch sales for each customer iteratively. For this prototype,
        // we'll fetch from a single known customer for demonstration.
        return query(collection(firestore, 'customers/test-customer/sales'));
    }, [firestore]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesRef);

    const customerIds = useMemo(() => {
        if (!salesData) return [];
        const ids = new Set(salesData.map(s => s.customerId));
        return Array.from(ids);
    }, [salesData]);

    const customersQuery = useMemoFirebase(() => {
        // Firestore 'in' query is limited to 30 items.
        if (customerIds && customerIds.length > 0) {
            return query(collection(firestore, 'customers'), where('id', 'in', customerIds.slice(0, 30)));
        }
        return null;
    }, [firestore, customerIds]);

    const { data: customersData, isLoading: customersLoading, error: customersError } = useCollection<Customer>(customersQuery);

    const [enrichedSales, setEnrichedSales] = useState<SaleWithDetails[]>([]);

    useEffect(() => {
        if (salesData && customersData) {
            const customerMap = new Map(customersData.map(c => [c.id, c]));
            const salesWithCustomer: SaleWithDetails[] = salesData.map(sale => ({
                ...sale,
                customer: customerMap.get(sale.customerId),
            }));
            setEnrichedSales(salesWithCustomer);
        } else if (salesData) {
            setEnrichedSales(salesData);
        }
    }, [salesData, customersData]);

    if (salesLoading || customersLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (salesError || customersError) {
        return <div className="text-destructive">Erreur lors du chargement des données.</div>
    }

    return (
        <SalesHistoryList sales={enrichedSales} />
    );
}

'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import type { Sale, Customer } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    // This is a simplification. A real app would use a collection group query
    // or fetch sales for each customer iteratively. For this prototype,
    // we'll fetch from a single known customer for demonstration.
    const salesRef = useMemoFirebase(() => query(collection(firestore, 'customers/test-customer/sales')), [firestore]);
    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesRef);

    const customerIds = useMemo(() => {
        if (!salesData) return [];
        // Get unique customer IDs from all sales
        const ids = new Set(salesData.map(s => s.customerId));
        return Array.from(ids);
    }, [salesData]);

    // We can only query for 30 items at a time in the 'in' query. This is a limitation we accept for the prototype.
    const customersQuery = useMemoFirebase(() => {
        if (customerIds && customerIds.length > 0) {
            return query(collection(firestore, 'customers'), where('id', 'in', customerIds.slice(0,30)));
        }
        return null;
    }, [firestore, customerIds]);

    const { data: customersData, isLoading: customersLoading, error: customersError } = useCollection<Customer>(customersQuery);

    const [enrichedSales, setEnrichedSales] = useState<Sale[]>([]);

    useEffect(() => {
        if (salesData && customersData) {
            const customerMap = new Map(customersData.map(c => [c.id, c]));
            const salesWithCustomer = salesData.map(sale => ({
                ...sale,
                customer: customerMap.get(sale.customerId) || undefined,
            }));
            setEnrichedSales(salesWithCustomer);
        } else if (salesData) {
            // If customers are still loading or failed, show sales without customer data
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
        <SalesHistoryList sales={enrichedSales || []} />
    );
}

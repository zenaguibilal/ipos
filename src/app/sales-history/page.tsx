'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collectionGroup, query, where } from "firebase/firestore";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import type { Sale, Customer, SaleWithDetails } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    // Use a collection group query to fetch all sales across all customers.
    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'sales'));
    }, [firestore]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesQuery);

    const customerIds = useMemo(() => {
        if (!salesData) return [];
        // Create a unique set of customer IDs from all sales
        const ids = new Set(salesData.map(s => s.customerId));
        return Array.from(ids);
    }, [salesData]);

    const customersQuery = useMemoFirebase(() => {
        if (!firestore || !customerIds || customerIds.length === 0) {
            return null;
        }
        // Firestore 'in' query is limited to 30 items.
        // For a real-world app with many customers, pagination or a different data structure would be needed.
        return query(collection(firestore, 'customers'), where('id', 'in', customerIds.slice(0, 30)));
    }, [firestore, customerIds]);

    const { data: customersData, isLoading: customersLoading, error: customersError } = useCollection<Customer>(customersQuery);

    const [enrichedSales, setEnrichedSales] = useState<SaleWithDetails[]>([]);

    useEffect(() => {
        if (salesData && customersData) {
            // Create a map for quick customer lookup
            const customerMap = new Map(customersData.map(c => [c.id, c]));
            const salesWithCustomer: SaleWithDetails[] = salesData.map(sale => ({
                ...sale,
                // Attach the customer object to each sale
                customer: customerMap.get(sale.customerId),
            }));
            setEnrichedSales(salesWithCustomer);
        } else if (salesData) {
            // If customers are still loading or not found, show sales without customer names
            setEnrichedSales(salesData);
        }
    }, [salesData, customersData]);

    if (salesLoading || customersLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (salesError || customersError) {
        // Concatenate error messages if both exist
        const errorMessage = [salesError?.message, customersError?.message].filter(Boolean).join('; ');
        return <div className="text-destructive">Erreur lors du chargement des données: {errorMessage}</div>
    }

    return (
        <SalesHistoryList sales={enrichedSales} />
    );
}

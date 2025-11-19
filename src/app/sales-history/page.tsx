'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query, where, documentId, Query } from "firebase/firestore";
import { Loader } from "lucide-react";
import { SalesHistoryList } from "@/components/sales/sales-history-list";
import type { Sale, Customer, SaleWithDetails } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

// Helper function to split an array into chunks
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// This new component fetches data for a single query.
// It ensures that useCollection is called unconditionally at the top level of this component.
function CustomerDataFetcher({ customerQuery, onData, onLoadingChange }: { customerQuery: Query<Customer> | null, onData: (data: Customer[]) => void, onLoadingChange: (loading: boolean) => void }) {
    const { data, isLoading, error } = useCollection<Customer>(customerQuery);

    useEffect(() => {
        if (!isLoading) {
            onData(data || []);
            onLoadingChange(false);
        } else {
            onLoadingChange(true);
        }
    }, [data, isLoading, onData, onLoadingChange]);

     useEffect(() => {
        if(error) {
            console.error("Error fetching customer chunk:", error);
            // Optionally handle individual chunk errors
        }
    }, [error]);

    return null; // This component doesn't render anything itself
}

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    // 1. Fetch all sales
    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'sales'));
    }, [firestore]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesQuery);
    
    // 2. Prepare customer ID chunks from sales data
    const customerIdChunks = useMemo(() => {
        if (!salesData) return [];
        const customerIds = Array.from(new Set(salesData.map(s => s.customerId)));
        if(customerIds.length === 0) return [];
        return chunkArray(customerIds, 30);
    }, [salesData]);

    // 3. Prepare queries for each customer ID chunk
    const customerQueries = useMemoFirebase(() => {
        if (!firestore || customerIdChunks.length === 0) return [];
        return customerIdChunks.map(chunk => 
            query(collection(firestore, 'customers'), where(documentId(), 'in', chunk))
        );
    }, [firestore, customerIdChunks]);

    // 4. State to hold aggregated customer data and loading status from all fetchers
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    const customersLoading = Object.values(loadingStates).some(isLoading => isLoading) || (customerQueries.length > 0 && Object.keys(loadingStates).length < customerQueries.length);

    // 5. Enrich sales with customer data
    const enrichedSales = useMemo(() => {
        if (!salesData || customersLoading) return [];
        
        const customerMap = new Map(allCustomers.map(c => [c.id, c]));
        
        return salesData.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId),
        }));
    }, [salesData, allCustomers, customersLoading]);

    if (salesLoading || (customerQueries.length > 0 && customersLoading)) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (salesError) {
        return <div className="text-destructive">Erreur lors du chargement des ventes: {salesError.message}</div>
    }

    return (
        <>
            {customerQueries.map((q, index) => (
                <CustomerDataFetcher
                    key={index}
                    customerQuery={q}
                    onLoadingChange={(isLoading) => {
                         setLoadingStates(prev => ({...prev, [index]: isLoading}));
                    }}
                    onData={(data) => {
                         setAllCustomers(prev => {
                            const newCustomers = [...prev.filter(c => !data.some(d => d.id === c.id)), ...data];
                            return newCustomers;
                         });
                    }}
                />
            ))}
            <SalesHistoryList sales={enrichedSales} />
        </>
    );
}

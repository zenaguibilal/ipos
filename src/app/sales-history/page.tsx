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
        // Only call onLoadingChange when isLoading status actually changes.
        onLoadingChange(isLoading);
    }, [isLoading, onLoadingChange]);
    
    useEffect(() => {
        if (!isLoading && data) {
            onData(data);
        }
    }, [data, isLoading, onData]);


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
        if (!salesData || salesData.length === 0) return [];
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
    const [allCustomers, setAllCustomers] = useState<Map<string, Customer>>(new Map());
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    
    const customersLoading = useMemo(() => {
      if (customerQueries.length === 0) return false;
      // Loading is true if any fetcher is loading OR if not all fetchers have reported their status yet.
      return Object.values(loadingStates).some(isLoading => isLoading) || Object.keys(loadingStates).length < customerQueries.length;
    }, [loadingStates, customerQueries.length]);


    // 5. Enrich sales with customer data
    const enrichedSales = useMemo(() => {
        if (!salesData || salesLoading || customersLoading) return [];
        
        return salesData.map(sale => ({
            ...sale,
            customer: allCustomers.get(sale.customerId),
        }));
    }, [salesData, salesLoading, customersLoading, allCustomers]);


    if (salesLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
    }

    if (salesError) {
        return <div className="text-destructive">Erreur lors du chargement des ventes: {salesError.message}</div>
    }

    // Handle the case where there are no sales after loading is complete.
    if (!salesData || salesData.length === 0) {
        return <SalesHistoryList sales={[]} />;
    }

    // This case will be hit when sales are loaded, but customers are still loading.
    if (customersLoading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin" /></div>;
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
                            const newMap = new Map(prev);
                            data.forEach(customer => newMap.set(customer.id, customer));
                            return newMap;
                         });
                    }}
                />
            ))}
            <SalesHistoryList sales={enrichedSales} />
        </>
    );
}

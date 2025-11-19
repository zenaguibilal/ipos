'use client';
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup, query, where, documentId } from "firebase/firestore";
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

// Custom hook to fetch multiple collections
function useCollections<T>(queries: any[]) {
    const results = queries.map(q => useCollection<T>(q));
    
    const data = useMemo(() => {
        if (results.some(r => r.isLoading)) return null;
        return results.map(r => r.data || []).flat();
    }, [results]);

    const isLoading = results.some(r => r.isLoading);
    const error = results.find(r => r.error)?.error || null;

    return { data, isLoading, error };
}

export default function SalesHistoryPage() {
    const firestore = useFirestore();

    const salesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'sales'));
    }, [firestore]);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useCollection<Sale>(salesQuery);
    
    const customerIdChunks = useMemo(() => {
        if (!salesData) return [];
        const customerIds = Array.from(new Set(salesData.map(s => s.customerId)));
        if(customerIds.length === 0) return [];
        return chunkArray(customerIds, 30);
    }, [salesData]);

    const customerQueries = useMemoFirebase(() => {
        if (!firestore || customerIdChunks.length === 0) return [];
        return customerIdChunks.map(chunk => 
            query(collection(firestore, 'customers'), where(documentId(), 'in', chunk))
        );
    }, [firestore, customerIdChunks]);

    const { data: allCustomers, isLoading: customersLoading, error: customersError } = useCollections<Customer>(customerQueries);

    const enrichedSales = useMemo(() => {
        if (!salesData || !allCustomers) return [];
        
        const customerMap = new Map(allCustomers.map(c => [c.id, c]));
        return salesData.map(sale => ({
            ...sale,
            customer: customerMap.get(sale.customerId),
        }));
    }, [salesData, allCustomers]);


    if (salesLoading || (customerIdChunks.length > 0 && customersLoading)) {
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
